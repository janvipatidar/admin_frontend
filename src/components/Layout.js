// Two-column layout used by every authenticated admin page.
import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => (
  <div className="app-shell">
    <Sidebar />
    <main className="main-content">{children}</main>
  </div>
);

export default Layout;
