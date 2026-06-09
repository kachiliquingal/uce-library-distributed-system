import { AuthForm } from "../components/auth/AuthForm";
import { useNavigate } from "react-router-dom";

export const LoginPage = () => {
  const navigate = useNavigate();
  const handleSuccess = () => {
    navigate("/catalog");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Optional background decorative element */}
      <div className="absolute top-0 left-0 w-full h-1/3 bg-blue-600 rounded-b-[4rem] shadow-lg"></div>

      <div className="z-10 w-full flex justify-center">
        <AuthForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
};
