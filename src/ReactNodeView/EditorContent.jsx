import React from 'react';

const EditorContent = React.forwardRef((props, ref) => {
  return (
    <div ref={ref} {...props} className={`EditorContent ${props.className}`} />
  );
});

EditorContent.displayName = 'EditorContent';

export default EditorContent;
