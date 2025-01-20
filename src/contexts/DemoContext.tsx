import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

interface DemoContextType {
  isDemo: boolean;
  enableDemo: () => void;
  disableDemo: () => void;
}

const DemoContext = createContext<DemoContextType>({
  isDemo: false,
  enableDemo: () => {},
  disableDemo: () => {},
});

export const DemoProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDemo, setIsDemo] = useState(false);
  const navigate = useNavigate();

  const enableDemo = () => {
    setIsDemo(true);
    navigate("/dashboard");
  };

  const disableDemo = () => {
    setIsDemo(false);
    navigate("/");
  };

  return (
    <DemoContext.Provider value={{ isDemo, enableDemo, disableDemo }}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => useContext(DemoContext);