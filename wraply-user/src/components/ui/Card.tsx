import { ReactNode } from "react";

interface CardProps{
  children:ReactNode;
  className?:string;
}

function Card({ children, className = "" }:CardProps){
  return(
    <div className={`rounded-xl border bg-card text-card-foreground shadow ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ children, className = "" }:CardProps){
  return(
    <div className={`p-4 border-b ${className}`}>
      {children}
    </div>
  );
}

function CardContent({ children, className = "" }:CardProps){
  return(
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  );
}

function CardTitle({ children, className = "" }:CardProps){
  return(
    <h3 className={`text-lg font-semibold ${className}`}>
      {children}
    </h3>
  );
}

export {
  Card,
  CardHeader,
  CardContent,
  CardTitle
};