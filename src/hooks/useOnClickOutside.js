import { useEffect } from 'react';

/**
 * Hook to handle clicks outside of a specified element.
 * Useful for closing modals, dropdowns, or collapsible panels.
 * 
 * @param {React.MutableRefObject} ref - The ref of the element to detect clicks outside of
 * @param {Function} handler - The callback function to run when a click outside occurs
 * @param {Array<React.MutableRefObject>} ignoreRefs - Optional array of additional refs to ignore (e.g. toggle buttons)
 */
export function useOnClickOutside(ref, handler, ignoreRefs = []) {
    useEffect(() => {
        const listener = (event) => {
            // Do nothing if clicking ref's element or descendent elements
            if (!ref.current || ref.current.contains(event.target)) {
                return;
            }

            // Do nothing if clicking ignored elements
            for (const ignoreRef of ignoreRefs) {
                if (ignoreRef.current && ignoreRef.current.contains(event.target)) {
                    return;
                }
            }

            handler(event);
        };

        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);

        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler, ignoreRefs]);
}
