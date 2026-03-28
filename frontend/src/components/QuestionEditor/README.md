# QuestionEditor Documentation

Block-based question authoring system using BlockNote.js for creating application forms.

## 📁 Files

```
QuestionEditor/
├── QuestionEditor.tsx          # Main editor component
├── blocks/
│   ├── questionBlocks.tsx      # Exports all blocks
│   ├── mcqBlock.tsx           # Multiple choice
│   ├── multiSelectBlock.tsx   # Multi-select 
│   ├── dropDownBlock.tsx      # Dropdown
│   ├── rankingBlock.tsx       # Ranking/ordering
│   └── shortTextBlock.tsx     # Text input
└── config/
    └── slashMenuItems.tsx     # Slash menu items
```

## 🎯 Question Types

| Type | Colors | Features |
|------|--------|----------|
| **Multiple Choice** | Blue | Radio buttons, single answer |
| **Multi-Select** | Green | Checkboxes, multiple answers |
| **Dropdown** | Purple | Select dropdown, single answer |
| **Ranking** | Orange | Drag-and-drop ordering |
| **Short Text** | Red | Text input with placeholder |

## 🛠️ Usage

```tsx
import QuestionEditor from './QuestionEditor/QuestionEditor';

function App() {
    return <QuestionEditor />;
}
```

### Slash Commands
- `/mcq` → Multiple Choice
- `/text` → Short Text  
- `/multiselect` → Multi-Select
- `/dropdown` → Dropdown
- `/ranking` → Ranking

## 🔧 Adding New Block

1. Create `blocks/newBlock.tsx`
2. Export in `questionBlocks.tsx`
3. Add to `QuestionEditor.tsx` schema
4. Add slash menu item

### Block Template

```typescript
export const newBlock = createReactBlockSpec(
    {
        type: "newType",
        propSchema: {
            question: { default: "" },
            description: { default: "" },
        },
        content: "none",
    },
    {
        render: (props) => {
            const { block, editor } = props;
            
            const updateQuestion = (text) => {
                editor.updateBlock(block, {
                    props: { ...block.props, question: text },
                });
            };
            
            return (
                <div className="border rounded-md p-3 bg-white">
                    <input onChange={(e) => updateQuestion(e.target.value)} />
                </div>
            );
        },
    }
);
```
bun start and look at pages/create_question/index.tsx for the example.

## 🎨 All Blocks Include

- **Question Input**: Main question text
- **Description**: Optional explanatory text  
- **Type Badge**: Color-coded identifier
- **Custom Controls**: Add/remove/reorder options

## 🔍 Common Issues

- **Block not showing**: Check schema registration
- **Slash menu missing**: Verify export in `slashMenuItems.tsx`
- **State not saving**: Use `editor.updateBlock()` properly
