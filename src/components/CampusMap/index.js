import React from 'react';
import './index.css'

const CampusMap = () => {
  return (
    <div className="campus-map-container">
      <div className="map-header">
        <h1>Kalasalingam Academy of Research and Education</h1>
        <p>3D Campus Map</p>
      </div>
      <iframe
        title="Kalasalingam Campus 3D Map"
        className="google-map-3d"
        src='https://maps.app.goo.gl/mEgrodzhEmBBtjaa7'
        allowFullScreen=""
        loading="lazy"
      ></iframe>
      <div className="map-legend">
        <h3>Key Locations:</h3>
        <ul>
          <li>Main Building</li>
          <li>Engineering Block</li>
          <li>Science Block</li>
          <li>Central Library</li>
          <li>Hostels</li>
          <li>Auditorium</li>
        </ul>
      </div>
    </div>
  );
};

export default CampusMap;