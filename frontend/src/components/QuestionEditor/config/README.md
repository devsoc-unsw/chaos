# Config

Configuration files for the QuestionEditor.

## Files

- `slashMenuItems.tsx` - Slash menu configuration

## Slash Menu Items

Defines the items that appear when users type `/` in the editor.

```typescript
export const getQuestionSlashMenuItems = (editor) => [
    {
        title: "Multiple Choice Question",
        onItemClick: () => { /* insert block */ },
        aliases: ["mcq", "multiple", "choice"],
        group: "Questions", 
        icon: <span>🔘</span>,
        subtext: "Create a multiple choice question"
    },
    // ... more items
];
```

## Item Properties

- `title` - Display name in menu
- `onItemClick` - Handler to insert block
- `aliases` - Search keywords 
- `group` - Category grouping
- `icon` - Visual indicator
- `subtext` - Description

## Usage

The slash menu is integrated in QuestionEditor:

```typescript
<SuggestionMenuController
    triggerCharacter="/"
    getItems={async (query) =>
        filterSuggestionItems(getQuestionSlashMenuItems(editor), query)
    }
/>
```

## Adding New Item

Add to the array in `slashMenuItems.tsx`:

```typescript
{
    title: "New Question Type",
    onItemClick: () => {
        editor.insertBlocks([{
            type: "newQuestion",
            props: { question: "Default text" }
        }], editor.getTextCursorPosition().block, "after");
    },
    aliases: ["new", "custom"],
    group: "Questions",
    icon: <span>🆕</span>,
    subtext: "Create a new question type"
}
```
