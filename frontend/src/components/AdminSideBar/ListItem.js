import React, { useState, useEffect } from 'react';

import plusIconDummy from './plus_icon.png';
import minusIconDummy from './minus_icon.png';
import newImageIcon from './new_image_icon.png';

import { isFormOpenContext } from '../../pages/admin'
import { orgContext } from '../../pages/admin'

const ListItem = ({ id, iconImg, text, isForm=false }) => {
  const [bgColor, setBgColor] = useState('#f0f4fc');
  const [iconSize, setIconSize] = useState('60px');
  const [uploadedImage, setUploadedImage] = useState({image: null, url: null});
  const [inputText, setInputText] = useState('');

  const {isFormOpen, setIsFormOpen} = React.useContext(isFormOpenContext);
  const {orgSelected, setOrgSelected, orgList, setOrgList} = React.useContext(orgContext);

  const onFileChange = (e) => {
    setUploadedImage({image: e.target.files[0], url: URL.createObjectURL(e.target.files[0])});
  }

  const onUpload = () => {
    // FIXME: send to the backend
    if (uploadedImage.image && inputText) {
      // FIXME: backend request should return new id, this method obv flawed (also floored)
      const newID = Math.floor(Math.random() * 1000);
      const newOrgList = orgList.concat({id: newID, icon: uploadedImage.url, orgName: inputText});
      setOrgList(newOrgList);
      setOrgSelected(newID);
      setUploadedImage({image: null, url: null});
      setInputText('');
      setIsFormOpen(false);
      alert('New organisation created!');
    } else {
      alert('Both image and text are required!');
    }
  }
  
  return (
    <li 
      style={{
        position: 'relative',
        display: 'table',
        width: '100%',
        listStyle: 'none',
        height: isForm ? (isFormOpen ? '140px' : '70px') : '70px',
        padding: '5px',
        backgroundColor: bgColor,
        verticalAlign: 'middle'
      }}
      transition='0.1s'
      onMouseOver={() => {
        setBgColor('#d4dae6');
        setIconSize('61.5px');
      }}
      onMouseOut={() => {
        setBgColor('#f0f4fc');
        setIconSize('60px');
      }}
    >
      <div 
        style={{
          display: 'flex',
          padding: '5px'
        }}
        onClick={() => {
          if (isForm) {
            setIsFormOpen(!isFormOpen);
          } else {
            setOrgSelected(id);
          }
        }}
      >
        <span style={listIconStyle}>
            <img 
              src={isForm ? (isFormOpen ? minusIconDummy : plusIconDummy) : iconImg}
              style={{
                width: iconSize,
                height: iconSize,
                borderRadius: '12px',
                borderStyle: id === orgSelected ? 'solid' : 'none',
                borderWidth: '2px',
                borderColor: '#088c94',
              }}
            />
          </span>
        <span style={listTitleStyle}>{text}</span>
      </div>
      {
        isForm && isFormOpen && 
        <div style={{ display: 'flex', padding: '5px'}}>
          <label style={listIconStyle} htmlFor='imgInput'>
            
              <img
                src={uploadedImage.image ? uploadedImage.url : newImageIcon} 
                style={{ 
                  width: iconSize, 
                  height: iconSize, 
                  borderRadius: '12px',
                }}
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
      }
    </li>
  )
}

const listIconStyle = {
  display: 'block',
  minWidth: '60px',
  height: '60px',
  lineHeight: '60px',
  margin: '0px',
}

const listTitleStyle = {
  position: 'relative',
  display: 'block',
  padding: '0 10px',
  height: '60px',
  lineHeight: '60px',
  textAlign: 'start',
  whiteSpace: 'nowrap',
  paddingLeft: '25px'
}

export default ListItem
