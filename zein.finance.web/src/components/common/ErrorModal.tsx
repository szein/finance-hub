import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorMessage: string;
}

export function ErrorModal({ isOpen, onClose, errorMessage }: ErrorModalProps) {
  React.useEffect(() => {
    if (errorMessage) {
      console.error('API Error:', errorMessage);
    }
  }, [errorMessage]);

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Error</ModalHeader>
        <ModalBody>
          <p>Something went wrong</p>
          {errorMessage && (
            <p className="text-sm text-default-500 mt-2">
              Details: {errorMessage}
            </p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onPress={onClose}>
            OK
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}