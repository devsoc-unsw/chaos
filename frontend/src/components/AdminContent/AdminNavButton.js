import React, { useState } from 'react'

const AdminNavButton = ({ text, selected, onClick }) => {
  const [isHover, setIsHover] = useState(false);
  return (
    <button 
      style={{
        width: '25%',
        height: '25%',
        margin: '20px',
        borderStyle: 'solid',
        borderColor: '#088c94',
        backgroundColor: selected || isHover ? '#f0f4fc' : 'white',
        borderWidth: selected || isHover ? '2px' : '1px',
        borderRadius: '12px',
        color: selected || isHover ? 'black' : 'grey',
        fontWeight: 'bold',
        fontSize: isHover ? '1.05rem' : '1rem'
      }}
      onMouseOver={() => setIsHover(true)}
      onMouseOut={() => setIsHover(false)}
      onClick={onClick}
    >
      {text}
    </button>
  )
}

export default AdminNavButton
