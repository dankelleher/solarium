import * as React from "react";

type Props = {
  text: string
  icon: React.ElementType<React.ComponentProps<'svg'>>
  onClick?: () => Promise<void> 
}

const Button = ({text, icon, onClick}:Props) => {
  const Icon = icon;
  return (
      <button
          type="button"
          onClick={onClick}
          className="flex-shrink-0 p-1 text-aeroBlue-200 rounded-full hover:text-white hover:bg-white hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-white"
      >
        <span className="sr-only">{text}</span>
        <Icon className="h-6 w-6" aria-hidden="true"/>
      </button>
  );
}

export default Button