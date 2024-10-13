import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link, Outlet } from 'react-router-dom';
import { FaUsers, FaBoxOpen, FaClipboardList, FaPlusSquare } from 'react-icons/fa';
import './AdminDashboard.css'; // Se till att CSS-filen finns
import RecentOrders from './RecentOrders'; 
const AdminDashboard: React.FC = () => {
  return (
    <div className="d-flex">
      {/* Vänster sidomeny */}
      <nav className="sidebar bg-dark text-white p-3">
        <h3 className="text-center">Panel</h3>
        <ul className="nav flex-column">
          <li className="nav-item">
            <Link className="nav-link text-white" to="/admin/customers">
              <FaUsers className="me-2" /> Kunder
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-white" to="/admin/orders">
              <FaClipboardList className="me-2" /> Ordrar
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-white" to="/admin/products">
              <FaBoxOpen className="me-2" /> Produkter
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-white" to="/admin/add-product">
              <FaPlusSquare className="me-2" /> Lägg till Produkt
            </Link>
          </li>
        </ul>
      </nav>

      {/* Huvudinnehåll */}
      <div className="container mt-4 flex-grow-1">
        <h1 className="text-center"></h1>
        <div className="mt-4">
        {location.pathname === '/admin/dashboard' ? <RecentOrders /> : <Outlet />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;




