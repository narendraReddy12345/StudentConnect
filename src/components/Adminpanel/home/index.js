
import "./index.css";
import FeatureCard from "../../FeatureCard";
import { useHistory} from "react-router-dom";


// Corrected import paths
import facultyAdminAnim from '../.././../assets/wckZq0erh9.json';
import eventAdminAnim from '../.././../assets/fuGIip804B.json';
import updatesAdminAnim from '../.././../assets/Ltz69bkEEA.json';
import formsAdminAnim from '../.././../assets/KE3rP60rHv.json';
import mapAdminAnim from '../.././../assets/t9sC61E7hk.json';


const AdminHome = ({ user, setUser }) => {
  const navigate = useNavigate();
 
  

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="user-info">
            <h2>Welcome Admin, {user?.name || "Administrator"} 👋</h2>
            <p className="user-email">99220041116@klu.ac.in</p>
          </div>
          
        </div>
      </div>

      <div className="features-grid">
        <FeatureCard
          title="Add Faculty"
          animationData={facultyAdminAnim}
          onClick={() => navigate("/admin/faculty")}
        />
        <FeatureCard
          title="Add Events"
          animationData={eventAdminAnim}
          onClick={() => navigate("/admin/events")}
        />
        <FeatureCard
          title="Manage Updates"
          animationData={updatesAdminAnim}
          onClick={() => navigate("/admin/updates")}
        />
        <FeatureCard
          title="Manage Forms"
          animationData={formsAdminAnim}
          onClick={() => navigate("/admin/forms")}
        />
        <FeatureCard
          title="Manage Campus Map"
          animationData={mapAdminAnim}
          onClick={() => navigate("/admin/map")}
        />
        
      </div>
    </div>
  );
};

export default AdminHome;