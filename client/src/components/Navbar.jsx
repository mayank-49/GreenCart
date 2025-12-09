import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { assets } from "../assets/assets";
import { useAppContext } from "../context/appContext";
import toast from "react-hot-toast";

export const Navbar = () => {
  const [open, setOpen] = useState(false); // State to manage mobile menu visibility
  const { user, setUser, setShowUserLogin, navigate, setSearchQuery, searchQuery, getCartCount,axios} = useAppContext();

  const logout = async () => {
    try {
      const {data} = await axios.get("/api/user/logout");
      if(data.success){
        toast.success(data.message);
        setUser(null);
        navigate('/')
      }else{
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(()=>{
    if(searchQuery.length > 0){
      navigate('/products')
    }
  },[searchQuery])

  return (
    <nav className="flex items-center justify-between px-6 md:px-16  py-4 border-b border-gray-300 bg-primary/10 relative transition-all">
      <NavLink to="/" onClick={()=>setOpen(false)}>
        <img src={assets.logo} alt="logo" className="h-9" />
      </NavLink>

      {/* Desktop Menu */}
      <div className="hidden sm:flex items-center gap-8">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/products">All Product</NavLink>
        <NavLink to="/contact">Contact</NavLink>

        <div className="hidden lg:flex items-center text-sm gap-2 border border-gray-300 px-3 rounded-full">
          <input
            className="py-1.5 w-full bg-transparent outline-none placeholder-gray-500"
            type="text"
            placeholder="Search products"
            onChange={(e)=>setSearchQuery(e.target.value)}
          />
          <img src={assets.search_icon} alt="search" className="w-4 h-4" />
        </div>

        <div onClick={()=> navigate('/cart')} className="relative cursor-pointer">
          <img
            src={assets.nav_cart_icon}
            alt="cart"
            className="w-6 opacity-80"
          />
          <button className="absolute -top-2 -right-3 text-xs text-white bg-primary w-[18px] h-[18px] rounded-full">
            {getCartCount()}
          </button>
        </div>

        {!user ? (
          <button onClick={()=> setShowUserLogin(true)} className="cursor-pointer px-8 py-2 bg-primary hover:bg-primary-dull transition-colors duration-300 ease-in-out text-white rounded-full">
            Login
          </button>
        ) :
        (
            <div className="relative group cursor-pointer">
                <img src={assets.profile_icon} alt="" className="w-10"/>
                <ul className="hidden group-hover:block absolute top-10 right-0 bg-white shadow border border-gray-200 p-2 w-30 rounded-md text-sm z-40">
                    <li onClick={()=>navigate('/my-orders')} className="p-1.5 pl-3 hover:bg-primary/10 cursor-pointer rounded-lg">My Orders</li>
                    <li onClick={logout} className="p-1.5 pl-3 hover:bg-primary/10 cursor-pointer rounded-lg">Logout</li>
                </ul>
            </div>
        )}
      </div>

      <div className="flex sm:hidden items-center gap-6">
        <div onClick={()=> navigate('/cart')} className="relative cursor-pointer">
          <img
            src={assets.nav_cart_icon}
            alt="cart"
            className="w-6 opacity-80"
          />
          <button className="absolute -top-2 -right-3 text-xs text-white bg-primary w-[18px] h-[18px] rounded-full">
            {getCartCount()}
          </button>
        </div>
        <button
          onClick={() => (open ? setOpen(false) : setOpen(true))}
          aria-label="Menu"
        >
          {/* Menu Icon SVG */}
          <img src={assets.menu_icon} alt="menu" />
        </button>
      </div>




      {/* Mobile Menu */}
      {open && (
        <div
          className={`${
            open ? "flex" : "hidden"
          } absolute top-[60px] left-0 w-full bg-white shadow-md py-4 flex-col items-start gap-2 px-5 text-sm md:hidden`}
        >
          <NavLink to="/" onClick={() => setOpen(false)}>
            Home
          </NavLink>
          <NavLink to="/products" onClick={() => setOpen(false)}>
            All Product
          </NavLink>
          {user && (
            <NavLink to="/products" onClick={() => setOpen(false)}>
              My Order
            </NavLink>
          )}
          <NavLink to="/products" onClick={() => setOpen(false)}>
            Contact
          </NavLink>
          {!user ? (
            <button
              onClick={() => {
                setOpen(false);
                setShowUserLogin(true);
              }}
              className="cursor-pointer px-6 py-2 mt-2 bg-primary hover:bg-primary-dull transition text-white rounded-full text-sm"
            >
              Login
            </button>
          ) : (
            <button
              onClick={logout}
              className="cursor-pointer px-6 py-2 mt-2 bg-primary hover:bg-primary-dull transition text-white rounded-full text-sm"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
};
