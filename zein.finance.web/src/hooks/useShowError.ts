import { useState } from 'react';

export function useShowError() {
  const [errorMessage, setErrorMessage] = useState('');
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  const showError = (message: string) => {
    setErrorMessage(message);
    setIsErrorModalOpen(true);
  };

  const closeErrorModal = () => setIsErrorModalOpen(false);

  return {
    errorMessage,
    isErrorModalOpen,
    showError,
    closeErrorModal
  };
}
