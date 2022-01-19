import React from 'react'
import newImageIcon from './new_image_icon.png';

// FIXME: refactor to use MUI styles and such
const CreateOrganisationForm = ({ uploadedImage, onFileChange, inputText, setInputText, onUpload }) => {
  return (
    <div style={{ display: 'flex', padding: '4px', paddingTop:'26px'}}>
      <label style={listIconStyle} htmlFor='imgInput'>
          <img
            src={uploadedImage.image ? uploadedImage.url : newImageIcon} 
            style={{ width: '60px', height: '60px', borderRadius: '12px' }}
          >
          </img> 
          <input id='imgInput' style={{display:'none'}} type='file' onChange={onFileChange}/>
      </label>
      <input 
        style={{
          height:'30px',
          width:'133px',
          margin:'15px',
          borderRadius: '12px',
          borderColor: 'black',
          borderWidth: '1px',
          padding:'10px'
        }} 
        type='text'
        placeholder="Name"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      >
      </input>
      <button 
        style={{
          height: '30px',
          width:'30px',
          marginTop:'15px',
          borderRadius: '12px',
          borderColor: 'black',
          borderWidth: '1px',
        }} 
        onClick={onUpload}
      >+
      </button>
    </div>
  )
}

const listIconStyle = {
  display: 'block',
  minWidth: '60px',
  height: '60px',
  lineHeight: '60px',
  margin: '0px',
}

export default CreateOrganisationForm
