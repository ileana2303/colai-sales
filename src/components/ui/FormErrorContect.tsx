import React from "react";

type ErrorCtx = {
  errors: Record<string, string | boolean>;
  clearError?: (field: string) => void;
};

const FormErrorsContext = React.createContext<ErrorCtx>({ errors: {} });

export default FormErrorsContext;
