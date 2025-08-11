import "./index.css";
import FeatureCard from "../../FeatureCard";
import { useHistory } from "react-router-dom";  // Changed from useNavigate

// Corrected import paths
import facultyAdminAnim from '../.././../assets/wckZq0erh9.json';
import eventAdminAnim from '../.././../assets/fuGIip804B.json';
import updatesAdminAnim from '../.././../assets/Ltz69bkEEA.json';
import formsAdminAnim from '../.././../assets/KE3rP60rHv.json';
import mapAdminAnim from '../.././../assets/t9sC61E7hk.json';

const AdminHome = ({ user, setUser }) => {
  const history = useHistory();  // Changed from useNavigate

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
          onClick={() => history.push("/admin/faculty")}  // Changed from navigate
        />
        <FeatureCard
          title="Add Events"
          animationData={eventAdminAnim}
          onClick={() => history.push("/admin/events")}
        />
        <FeatureCard
          title="Manage Updates"
          animationData={updatesAdminAnim}
          onClick={() => history.push("/admin/updates")}
        />
        <FeatureCard
          title="Manage Forms"
          animationData={formsAdminAnim}
          onClick={() => history.push("/admin/forms")}
        />
        <FeatureCard
          title="Manage Campus Map"
          animationData={mapAdminAnim}
          onClick={() => history.push("/admin/map")}
        />
      </div>
    </div>
  );
};

export default AdminHome;