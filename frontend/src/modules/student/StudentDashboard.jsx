

const StudentDashboard = () => {

  const user = JSON.parse(localStorage.getItem('userData'));

  return (
    <div className="wrapper row">
      <div className="col-3">
        <h2>Hello {user.name} </h2>
        <p>Welcome back!</p>
        <p>How are you today?</p>
      </div>
      <div className="col-9">
        Posts
      </div>
    </div>
  );
};

export default StudentDashboard;