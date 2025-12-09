import Order from "../models/order.js";
import Product from "../models/product.js";
import razorpay from "razorpay";
import crypto from "crypto";


//Place Order COD: /api/order/cod
export const placeOrderCOD = async (req, res) => {
    try {
        const userId = req.userId;
        const {items,address} = req.body;

        if(!address || items.length === 0){
            return res.json({success:false, message:"Address and items are required to place order"});
        }
        //Calculate amount using items
        let amount = await items.reduce(async (acc, item) => {
            const product = await Product.findById(item.product);
            return (await acc) + product.price * item.quantity;
        }, 0);

        // Add tax charge (2%)
        amount += Math.floor(amount * 0.02);

        await Order.create({userId, items, amount, address, paymentType: "COD"});
        return res.json({success: true, message: "Order placed successfully"});

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}


//Place Order RazorPay: /api/order/razorpay
// controllers/orderController.js


const razorInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * POST /api/order/razorpay
 * Creates an Order (isPaid: false) in DB and returns razorpay order + public key
 */
export const placeOrderRazorPay = async (req, res) => {
  try {
    const userId = req.userId;
    const { items, address } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!address || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Address and items are required to place order" });
    }

    // calculate amount using offerPrice (fallback to price)
    let amount = 0;
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });
      }
      const unitPrice = typeof product.offerPrice === "number" ? product.offerPrice : product.price;
      amount += unitPrice * (item.quantity || 1);
    }

    // Add 2% tax (rounded down)
    const tax = Math.floor(amount * 0.02);
    amount += tax;

    amount = Math.round(Number(amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid order amount calculated" });
    }

    // Create order in DB with payment pending
    const newOrder = await Order.create({
      userId,
      items,
      amount,
      address,
      status: "Payment Pending",
      paymentType: "RAZORPAY",
      isPaid: false,
    });

    // sanitize and validate currency
    const rawCurrency = process.env.CURRENCY || "INR";
    const currency = String(rawCurrency).toUpperCase().trim();
    if (!/^[A-Z]{3}$/.test(currency)) {
      // cleanup and error
      await Order.findByIdAndDelete(newOrder._id).catch(() => {});
      return res.status(500).json({ success: false, message: "Server currency misconfiguration. Expected 3-letter code like 'INR'." });
    }

    const options = {
      amount: Math.round(amount * 100), // paise
      currency,
      receipt: newOrder._id.toString(),
      payment_capture: 1,
    };

    let razorOrder;
    try {
      razorOrder = await razorInstance.orders.create(options);
    } catch (rpErr) {
      console.error("Razorpay order creation failed:", rpErr);
      await Order.findByIdAndDelete(newOrder._id).catch(() => {});
      const message = rpErr?.error?.description || rpErr?.message || "Razorpay order creation failed";
      return res.status(502).json({ success: false, message });
    }

    // Save razorpay order id for future matching (webhooks etc)
    await Order.findByIdAndUpdate(newOrder._id, { razorpayOrderId: razorOrder.id });

    // Return razorOrder AND public key for client to initialize checkout
    return res.json({
      success: true,
      razorOrder,
      orderId: newOrder._id,
      amount,
      razorpayKey: process.env.RAZORPAY_KEY_ID // safe to expose (public key)
    });
  } catch (error) {
    console.error("placeOrderRazorPay error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/order/verify
 * Verifies razorpay signature, sets isPaid=true and status
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId (optional) }
 */
export const verifyOrderPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing payment verification parameters" });
    }

    // verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature - verification failed" });
    }

    // find order by orderId or razorpayOrderId
    let order;
    if (orderId) {
      order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ success: false, message: "Order not found" });
      if (order.razorpayOrderId && order.razorpayOrderId !== razorpay_order_id) {
        return res.status(400).json({ success: false, message: "Order mismatch" });
      }
    } else {
      order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
      if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    }

    // optional: ensure req.userId owns order (if auth middleware is used)
    if (req.userId && String(req.userId) !== String(order.userId)) {
      return res.status(403).json({ success: false, message: "Forbidden: you don't own this order" });
    }

    // idempotency
    if (order.isPaid) {
      return res.json({ success: true, message: "Payment already confirmed", orderId: order._id });
    }

    // mark paid and attach razorpay meta
    order.isPaid = true;
    order.status = "Order Confirmed"; // change to what you use
    order.razorpay = {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    };
    await order.save();

    return res.json({ success: true, message: "Payment verified and order confirmed", orderId: order._id });
  } catch (error) {
    console.error("verifyOrderPayment error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

//Get order by  User ID: /api/order/user
export const getUserOrders = async(req,res) => {
    try {
        const userId = req.userId;
        const orders = await Order.find({
            userId,
            $or:[{paymentType:"COD"},{isPaid: true}]
        }).populate("items.product address").sort({createdAt: -1});
        res.json({success:true, orders});

    } catch (error) {
        console.log(error.message);
        res.json({success:false, message:error.message});
    }
}


//Get all orders (Admin): /api/order/seller
export const getAllOrders = async(req,res) => {
    try {
        const orders = await Order.find({
            $or:[{paymentType:"COD"},{isPaid: true}]
        }).populate("items.product address").sort({createdAt: -1});
        res.json({success:true, orders});

    } catch (error) {
        console.log(error.message);
        res.json({success:false, message:error.message});
    }
}

