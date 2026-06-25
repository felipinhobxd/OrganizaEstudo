import { forgotPassword } from '@/app/auth/actions';

export default async function ForgotPasswordPage(props: {
  searchParams: Promise<{ message: string; error: string }>;
}) {
  const searchParams = await props.searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div>
          <h1 className="text-center text-3xl font-extrabold tracking-tight text-gray-900">
            Recuperar Senha
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enviaremos um link para o seu email
          </p>
        </div>

        {searchParams.error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
            {searchParams.error}
          </div>
        )}

        {searchParams.message && (
          <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700 border border-blue-200">
            {searchParams.message}
          </div>
        )}

        <form className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <button
            formAction={forgotPassword}
            className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Enviar Link
          </button>
          <div className="text-center mt-4">
            <a href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              Voltar para o Login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
