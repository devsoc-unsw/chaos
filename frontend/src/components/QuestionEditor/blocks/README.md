# Question Blocks

Individual question type implementations for the BlockNote editor.

## Files

- `questionBlocks.tsx` - Exports all blocks
- `mcqBlock.tsx` - Multiple choice (radio buttons)
- `multiSelectBlock.tsx` - Multi-select (checkboxes)  
- `dropDownBlock.tsx` - Dropdown selection
- `rankingBlock.tsx` - Drag-and-drop ranking
- `shortTextBlock.tsx` - Text input

## Block Structure

All blocks follow this pattern:

```typescript
export const blockName = createReactBlockSpec(
    {
        type: "blockType",
        propSchema: {
            question: { default: "" },
            description: { default: "" },
            // Block-specific props
        },
        content: "none",
    },
    {
        render: (props) => {
            const { block, editor } = props;
            
            const updateQuestion = (text) => {
                editor.updateBlock(block, { 
                    props: { ...block.props, question: text } 
                });
            };
            
            return <div>/* UI */</div>;
        }
    }
);
```

## Common Features

All blocks include:
- **Question input** - Main question text
- **Description textarea** - Optional explanatory text
- **Type badge** - Color-coded identifier
- **State management** - Real-time updates

## Block-Specific Features

### MCQ Block (`mcqBlock.tsx`)
- Radio buttons for single selection
- Add/remove options
- Blue theme

### Multi-Select Block (`multiSelectBlock.tsx`)  
- Checkboxes for multiple selection
- Add/remove options
- Green theme

### Dropdown Block (`dropDownBlock.tsx`)
- Select dropdown preview
- Radio buttons for editing
- Purple theme

### Ranking Block (`rankingBlock.tsx`)
- Drag-and-drop reordering with `@hello-pangea/dnd`
- Up/down arrows for manual ordering
- Numbered ranking display
- Orange theme

### Short Text Block (`shortTextBlock.tsx`)
- Text input with placeholder
- Preview of answer field
- Red theme

## Adding New Block

1. Create new file: `blocks/newBlock.tsx`
2. Follow the structure pattern above
3. Export in `questionBlocks.tsx`
4. Add to main editor schema
