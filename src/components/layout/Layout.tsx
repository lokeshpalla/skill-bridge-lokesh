import Navbar from "./Navbar";
import AIAssistant from "@/components/ai/AIAssistant";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">{children}</main>
      <AIAssistant />
    </div>
  );
};

export default Layout;
