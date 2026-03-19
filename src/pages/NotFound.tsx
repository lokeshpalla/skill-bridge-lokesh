import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero relative">
      <div className="absolute inset-0 bg-grid-subtle" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center relative z-10"
      >
        <div className="text-8xl font-bold text-gradient mb-4">404</div>
        <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/">
            <Button variant="hero">
              <Home className="w-4 h-4" /> Go Home
            </Button>
          </Link>
          <Button variant="glow" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4" /> Go Back
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
