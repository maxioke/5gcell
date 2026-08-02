import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
    }
  }

  async function handleRegister() {
    if (!businessName.trim()) {
      alert("Ingrese el nombre del taller.");
      return;
    }

    if (!ownerName.trim()) {
      alert("Ingrese el nombre del propietario.");
      return;
    }

    if (!phone.trim()) {
      alert("Ingrese el teléfono.");
      return;
    }

    if (!email.trim()) {
      alert("Ingrese un correo.");
      return;
    }

    if (password.length < 6) {
      alert("La contraseña debe tener mínimo 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      alert(error.message);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          business_name: businessName,
          owner_name: ownerName,
          phone: phone,
        });

      if (profileError) {
        setLoading(false);
        alert(profileError.message);
        return;
      }
    }

    setLoading(false);

    alert("Cuenta creada correctamente.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">

        <h1 className="text-3xl font-bold text-center mb-2">
          5G CELL COMUNICACIONES
        </h1>

        <p className="text-center text-gray-500 mb-8">
          {isRegister ? "Crear una cuenta" : "Iniciar sesión"}
        </p>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            if (isRegister) {
              e.preventDefault();
              handleRegister();
            } else {
              handleLogin(e);
            }
          }}
        >

          {isRegister && (
            <>
              <input
                className="w-full border rounded-lg p-3"
                placeholder="Nombre del taller"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />

              <input
                className="w-full border rounded-lg p-3"
                placeholder="Nombre del propietario"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
              />

              <input
                className="w-full border rounded-lg p-3"
                placeholder="Teléfono"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </>
          )}

          <input
            className="w-full border rounded-lg p-3"
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full border rounded-lg p-3"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {isRegister && (
            <input
              className="w-full border rounded-lg p-3"
              type="password"
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          )}

          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg p-3 hover:bg-blue-700"
          >
            {loading
              ? "Procesando..."
              : isRegister
              ? "Crear cuenta"
              : "Ingresar"}
          </button>

        </form>

        <button
          type="button"
          onClick={() => setIsRegister(!isRegister)}
          className="mt-5 w-full text-blue-600 font-semibold"
        >
          {isRegister
            ? "¿Ya tienes una cuenta? Inicia sesión"
            : "¿No tienes cuenta? Crear cuenta"}
        </button>

      </div>
    </div>
  );
}