
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";

const Index: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-4xl font-bold mb-4 text-blue-600">Product Catalogue</h1>
        <p className="text-gray-600 mb-6">
          Build and manage dynamic insurance product questionnaires with ease.
        </p>
        <Link to="/product-catalogue">
          <Button className="w-full">
            Start Building
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;
