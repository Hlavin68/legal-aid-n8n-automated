import React from "react";
import { Outlet } from "react-router-dom";
import Navigation from "./Navigation";

const AppLayout = () => {
  return (
    <>
      <Navigation />
      <main className="flex-grow-1">
        <Outlet />
      </main>
    </>
  );
};

export default AppLayout;