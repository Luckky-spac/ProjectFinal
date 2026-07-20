import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function PasswordInput({ className = '', ...rest }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input type={visible ? 'text' : 'password'} className={`${className} pr-10`} {...rest} />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {visible ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  );
}
