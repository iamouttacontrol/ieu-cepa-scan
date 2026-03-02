// This file is kept for backwards compatibility but is no longer the main entry point.
// See App.tsx for the actual routing setup.
import { Navigate } from "react-router-dom";

const Index = () => <Navigate to="/" replace />;

export default Index;
