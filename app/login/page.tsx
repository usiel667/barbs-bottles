import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Droplets } from "lucide-react";


export default async function LoginPage() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (user) {
    redirect("/home");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-cyan-100 dark:from-gray-900 dark:to-gray-800">
      <div
        className="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/bee_bottle.webp')" }}
      >
        <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Droplets className="h-12 w-12 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Barb&apos;s Custom Bottles</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Custom Water Bottle Management</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Sign in to continue</p>
          </div>

          <div className="space-y-4">
            <LoginLink>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Sign in
              </Button>
            </LoginLink>
          </div>
        </div>
      </div>
    </div>
  );

}
