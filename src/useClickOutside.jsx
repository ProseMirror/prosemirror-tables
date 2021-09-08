import {useCallback, useEffect, useRef} from 'react';

/* USAGE:
// const ref = useClickOutside(() => {...});
*/
const useClickOutside = (onClose) => {
  const ref = useRef(null);
  const escapeListener = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  const clickListener = useCallback(
    (e) => {
      if (!ref.current.contains(e.target) && e.target.isConnected) {
        onClose?.();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('click', clickListener);
    document.addEventListener('keyup', escapeListener);
    return () => {
      document.removeEventListener('click', clickListener);
      document.removeEventListener('keyup', escapeListener);
    };
  }, [clickListener, escapeListener]);
  return ref;
};

export default useClickOutside;
