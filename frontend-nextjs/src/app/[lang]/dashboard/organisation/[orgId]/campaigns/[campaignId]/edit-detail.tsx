import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, $createParagraphNode, $createTextNode } from "lexical";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import type { LexicalEditor } from "lexical";

interface EditDetailsProps {
  namespace: string;
  value: string;
  onChange: (value: string) => void;
  editable: boolean;
  numOnly?: boolean;
  maxLength: number;
  remainingHint?: boolean;
  isError?: boolean;
  setIsError?: Dispatch<SetStateAction<void>>;
}

const initialisedEditors = new WeakMap<LexicalEditor, boolean>();

function EditorContentPlugin({
  initialValue,
  numOnly,
  maxLength,
  onLengthChange,
  onNumberChange,
  isError,
  setIsError
}: {
  initialValue: string;
  numOnly: boolean;
  maxLength?: number;
  onLengthChange: (length: number) => void;
  onNumberChange?: (number: number) => void;
  isError?: boolean;
  setIsError?: Dispatch<SetStateAction<void>>;
}) {
  const [editor] = useLexicalComposerContext();
  const lastText = useRef(initialValue)

  useEffect(() => {
    if (!editor) return;

    editor.update(() => {
      const root = $getRoot();
      const currentText = root.getTextContent();
  
      if (currentText !== initialValue) {
        root.clear();
  
        if (initialValue) {
          const paragraph = $createParagraphNode();
          paragraph.append($createTextNode(initialValue));
          root.append(paragraph);
        }
  
        onLengthChange(initialValue.length);
        if (numOnly && onNumberChange) {
          onNumberChange(Number(initialValue) || 0);
        }

        lastText.current = initialValue;
      }
    });

    if (initialisedEditors.get(editor)) {
      editor.getEditorState().read(() => {
        const root = $getRoot();
        const currentText = root.getTextContent();
        onLengthChange(currentText.length);
        if (isError && setIsError) {
          setIsError();
        }
      });
      return;
    }

    editor.getEditorState().read(() => {
      const root = $getRoot();
      const currentText = root.getTextContent();

      if (currentText === "" && initialValue) {
        initialisedEditors.set(editor, true);
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          const paragraph = $createParagraphNode();
          paragraph.append($createTextNode(initialValue));
          root.append(paragraph);
          onLengthChange(initialValue.length);
        });
      } else {
        initialisedEditors.set(editor, true);
        onLengthChange(currentText.length);
      }
    });

  }, [editor, initialValue, numOnly, maxLength, onLengthChange, onNumberChange]);

  useEffect(() => {
    if (!numOnly && !maxLength) return;

    const removeUpdateListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const originalText = root.getTextContent();
        let text = originalText;

        if (numOnly) {
          text = String(Number(text.split("").filter(char => !isNaN(Number(char))).join("")));
        }

        if ((maxLength && numOnly && Number(text) > maxLength*10) ||
          (numOnly && Number(text) < 1) ||
          (maxLength && !numOnly && text.length > maxLength * 2)) {
          text = lastText.current;
        } else {
          lastText.current = text;
        }

        if (text !== originalText) {
          editor.update(() => {
            const root = $getRoot();
            root.clear();
            if (text) {
              const paragraph = $createParagraphNode();
              paragraph.append($createTextNode(text));
              root.append(paragraph);
            }
          }, {
            onUpdate: () => {
              onLengthChange(text.length);
              if (numOnly && onNumberChange) {
                onNumberChange(Number(text) || 0);
              }
            }
          });
        }
      });
    });

    return () => {
      removeUpdateListener();
    };
  }, [editor, numOnly, maxLength, onLengthChange, onNumberChange]);

  return null;
}

export default function EditDetail({ namespace, value, onChange, editable, numOnly = false, maxLength, remainingHint, isError, setIsError }: EditDetailsProps) {
  const [currentLength, setCurrentLength] = useState(value.length);
  const [currentNumber, setCurrentNumber] = useState(Number(value) || 1);

  const config = {
    namespace: namespace,
    editable,
    theme: {
      paragraph: "",
    },
    onError(error: Error) {
      console.error(error);
    },
  };

  function EditablePlugin({ editable }: { editable: boolean }) {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
      editor.setEditable(editable);
    }, [editable, editor]);

    return null;
  }

  return (
    <div className="relative">
      <LexicalComposer initialConfig={config}>
        <PlainTextPlugin
          contentEditable={
            <ContentEditable className={editable ?
              `border rounded px-2 py-1 focus:outline-none focus:ring-2
              ${(((!numOnly && maxLength - currentLength >= 0) || (numOnly && currentNumber <= maxLength)) && !isError) ? 
                "border-gray-300 focus:ring-blue-500" : 
                "ring-2 ring-red-500"}` :
              ""} />
          }
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />

        <OnChangePlugin onChange={(editorState) => {
          editorState.read(() => {
            const root = $getRoot();
            const text = root.getTextContent();
            setCurrentLength(text.length);
            if (numOnly) {
              setCurrentNumber(Number(text) || 1);
            }
            onChange(text);
          });
        }} />
        <EditorContentPlugin
          initialValue={value}
          numOnly={numOnly}
          maxLength={maxLength}
          onLengthChange={setCurrentLength}
          onNumberChange={setCurrentNumber}
          isError={isError}
          setIsError={setIsError}
        />
        <EditablePlugin editable={editable} />
      </LexicalComposer>
      {maxLength && editable && remainingHint && (
        <div className={`absolute bottom-1 right-2 text-xs pointer-events-none ${(!numOnly && maxLength - currentLength <= 10) || (numOnly && (currentNumber > maxLength || currentNumber < 1))
          ? 'text-red-500 font-medium'
          : 'text-gray-500'
          }`}>
          {!numOnly && maxLength - currentLength}
        </div>
      )}
    </div>
  );
}