import React, { useState } from 'react'
import AdminNavButton from "./AdminNavButton";
import DeleteButton from "./DeleteButton";

// FIXME: content not aligned with sidebar, need to change sidebar :(

const AdminContent = ({ id, icon, orgName }) => {
  // since there are only 2 states, window is a Boolean where
  // true -> members and false -> campaigns
  const [toggleWindow, setToggleWindow] = useState(false);

  return (
    <div style={{
      flex: '1 0 auto',
      height: '100%',
      backgroundColor: 'white'}}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          height: '200px',
          backgroundColor: 'white',
          alignItems: 'center'
        }}
      >
        <div style={{
          display: 'flex',
          width: '50%',
          height: '100%',
          alignItems: 'center'
        }}>
          <img 
            src={icon}
            style={{
              height: '100px',
              width: '100px',
              margin: '45px',
              marginLeft: '80px',
              borderRadius: '12px',
            }}
          >
          </img>
          <div style={{
            display: 'inline-flex',
            alignSelf: 'center',
            fontSize: '3rem'}}
          >{orgName}
          </div>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          backgroundColor: 'white',
          height: '100%',
          width: '50%',
          marginRight: '80px'
        }}>
          <AdminNavButton 
            text='Campaigns'
            selected={!toggleWindow}
            onClick={() => setToggleWindow(false)}
          />
          <AdminNavButton
            text='Members'
            selected={toggleWindow}
            onClick={() => setToggleWindow(true)}
          />
          <DeleteButton id={id}/>
        </div>
      </div>
      <div style={{
        margin: '80px',
        marginTop: '0px',
        height: '69%',
        borderColor: 'grey',
        borderStyle: 'solid',
        borderRadius: '12px',
        borderWidth: '1px',
        backgroundColor: '#f0f4fc'
      }}>

      </div>
    </div>
  )
}

export default AdminContent
