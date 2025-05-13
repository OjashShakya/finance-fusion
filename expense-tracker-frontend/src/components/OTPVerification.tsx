// import { useAuth } from "../context/AuthContext";
// import { useState } from "react";
// import { useRouter } from "next/navigation";

// interface OTPVerificationProps {
//   email: string;
//   type: 'signup' | 'login';
// }

// const OTPVerification: React.FC<OTPVerificationProps> = ({ email, type }) => {
//   const [otp, setOtp] = useState("");
//   const [error, setError] = useState("");
//   const { verifyOTP } = useAuth();
//   const router = useRouter();

//   const handleVerify = async (e: React.FormEvent) => {
//     e.preventDefault();
//     try {
//       const result = await verifyOTP(otp);
//       if (result.success) {
//         if (type === 'signup') {
//           router.push('/login');
//         } else {
//           router.push('/dashboard');
//         }
//       } else {
//         setError(result.message || "Invalid OTP");
//       }
//     } catch (err) {
//       setError("An error occurred during verification");
//     }
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen">
//       <h2 className="text-2xl font-bold mb-4">Verify OTP</h2>
//       <p className="mb-4">Enter the OTP sent to {email}</p>
//       {error && <p className="text-red-500 mb-4">{error}</p>}
//       <form onSubmit={handleVerify} className="flex flex-col gap-4">
//         <input
//           type="text"
//           value={otp}
//           onChange={(e) => setOtp(e.target.value)}
//           placeholder="Enter OTP"
//           className="p-2 border rounded"
//           required
//         />
//         <button
//           type="submit"
//           className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
//         >
//           Verify
//         </button>
//       </form>
//     </div>
//   );
// };

// export default OTPVerification; 