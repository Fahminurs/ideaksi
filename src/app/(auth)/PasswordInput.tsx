"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import styles from "./auth.module.css";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export default function PasswordInput(props: Props) {
  const [show, setShow] = useState(false);

  return (
    <div className={styles.passwordRow}>
      <input {...props} type={show ? "text" : "password"} />
      <button
        type="button"
        className={styles.eyeBtn}
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
        aria-pressed={show}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
