const StudentDashboard = () => {
  const user = JSON.parse(localStorage.getItem("userData"));
  console.log(user);
  return (
    <div className="wrapper row">
      <div className="col-3">
        <img
          src={user.avatar}
          alt={`${user.name}'s avatar`}
          className="rounded-circle mb-3 avatar"
          style={{ width: "60px", height: "60px", objectFit: "cover" }}
        />
        <h2>Hello {user.name} </h2>
        <p>Welcome back!</p>
        <p>How are you today?</p>
      </div>
      <div className="col-9">Posts</div>
    </div>
  );
};

export default StudentDashboard;
