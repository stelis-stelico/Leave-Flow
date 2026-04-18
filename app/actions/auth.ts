"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function signup(
  _prevState: { error?: string; success?: string },
  formData: FormData
) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const full_name = formData.get("full_name") as string;

  if (!email || !password || !full_name) {
    return { error: "Full name, email, and password are required." };
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name },
    },
  });

  if (authError) {
    console.error("SIGNUP ERROR:", authError.message);
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "Signup failed. No user was created." };
  }

  revalidatePath("/", "layout");
  return { success: "Account created successfully. You can now log in." };
}