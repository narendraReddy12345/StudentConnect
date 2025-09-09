import "./index.css";
import FeatureCard from "../../FeatureCard";
import { useHistory } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5"; // Import the back arrow icon

// Corrected import paths
import facultyAdminAnim from '../.././../assets/wckZq0erh9.json';
import eventAdminAnim from '../.././../assets/fuGIip804B.json';
import updatesAdminAnim from '../.././../assets/Ltz69bkEEA.json';
import formsAdminAnim from '../.././../assets/KE3rP60rHv.json';

const AdminHome = ({ user, setUser }) => {
  const history = useHistory();

  const handleGoBack = () => {
    // Navigate to the home page - adjust the path as needed
    history.push("/");
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          {/* Back arrow button */}
          <button className="admin-back-button" onClick={handleGoBack}>
            <IoArrowBack size={20} />
          </button>
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
          onClick={() => history.push("/admin/faculty")}
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
      </div>
    </div>
  );
};

export default AdminHome;