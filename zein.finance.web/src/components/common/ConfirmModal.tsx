import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@heroui/react";

interface ErrorModalProps {
    isOpen: boolean;
    onConfirm: ()=> void;
    onClose: () => void;
    confirmMsg: string;
}

export const ConfirmModal = ({ isOpen, onConfirm, onClose, confirmMsg: message }: ErrorModalProps) => {
  return (
   <Modal isOpen={isOpen} onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Confirm Delete</ModalHeader>
        <ModalBody>
            <p>{message}</p>
        </ModalBody>
        <ModalFooter>
            <Button color="danger" variant="light" onPress={onConfirm}>
                Delete
            </Button>
            <Button color="primary" onPress={onClose}>
                Cancel
            </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}