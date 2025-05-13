import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Spin,
  Alert,
  Progress,
  List,
  Timeline,
} from "antd";
import {
  UserOutlined,
  TeamOutlined,
  FileProtectOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import moment from "moment";

const { Title, Text, Paragraph } = Typography;

const DashboardOverview = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [systemStats, setSystemStats] = useState({
    activeUsers: 0,
    totalUsers: 0,
    students: 0,
    teachers: 0,
    counselors: 0,
    admins: 0,
    serverHealth: 95,
    diskUsage: 42,
    memoryUsage: 38,
  });
  const [recentActivities, setRecentActivities] = useState([]);

  const user = JSON.parse(localStorage.getItem("userData")) || {};

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Replace with actual API endpoints
      const statsResponse = await axios.get(
        "http://localhost:3000/api/admin/system-stats",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      const activitiesResponse = await axios.get(
        "http://localhost:3000/api/admin/recent-activities",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (statsResponse.data && activitiesResponse.data) {
        setSystemStats(statsResponse.data);
        setRecentActivities(activitiesResponse.data.activities || []);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      // Use mock data for demonstration
      setSystemStats({
        activeUsers: 32,
        totalUsers: 157,
        students: 120,
        teachers: 25,
        counselors: 10,
        admins: 2,
        serverHealth: 95,
        diskUsage: 42,
        memoryUsage: 38,
      });

      setRecentActivities([
        {
          id: 1,
          action: "User login",
          username: "john.doe",
          timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
          details: "Login from IP 192.168.1.105",
        },
        {
          id: 2,
          action: "System backup",
          username: "system",
          timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
          details: "Scheduled backup completed successfully",
        },
        {
          id: 3,
          action: "User created",
          username: "admin",
          timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
          details: "Created new student user 'maria.smith'",
        },
        {
          id: 4,
          action: "Settings updated",
          username: "admin",
          timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
          details: "Updated privacy policy settings",
        },
        {
          id: 5,
          action: "Failed login attempt",
          username: "unknown",
          timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
          details: "Multiple failed attempts from IP 203.0.113.42",
        },
      ]);

      setError("Could not fetch live data. Displaying demonstration data.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
        <div style={{ marginTop: "20px" }}>Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <Title level={2}>System Dashboard</Title>
      <Paragraph>System overview and key metrics for KumustaKaApp</Paragraph>

      {error && (
        <Alert
          message={error}
          type="warning"
          showIcon
          style={{ marginBottom: "20px" }}
        />
      )}

      {/* User Statistics */}
      <Title level={3} style={{ marginTop: "20px" }}>
        User Statistics
      </Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="status-card">
            <Statistic
              title="Active Users"
              value={systemStats.activeUsers}
              prefix={<UserOutlined />}
              suffix={`/ ${systemStats.totalUsers}`}
              valueStyle={{ color: "#722ed1" }}
            />
            <Progress
              percent={Math.round(
                (systemStats.activeUsers / systemStats.totalUsers) * 100
              )}
              strokeColor="#722ed1"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="status-card">
            <Statistic
              title="Students"
              value={systemStats.students}
              valueStyle={{ color: "#1890ff" }}
              prefix={<TeamOutlined />}
            />
            <Text type="secondary">
              {Math.round(
                (systemStats.students / systemStats.totalUsers) * 100
              )}
              % of users
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="status-card">
            <Statistic
              title="Teachers"
              value={systemStats.teachers}
              valueStyle={{ color: "#52c41a" }}
              prefix={<TeamOutlined />}
            />
            <Text type="secondary">
              {Math.round(
                (systemStats.teachers / systemStats.totalUsers) * 100
              )}
              % of users
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="status-card">
            <Statistic
              title="Counselors"
              value={systemStats.counselors}
              valueStyle={{ color: "#fa8c16" }}
              prefix={<TeamOutlined />}
            />
            <Text type="secondary">
              {Math.round(
                (systemStats.counselors / systemStats.totalUsers) * 100
              )}
              % of users
            </Text>
          </Card>
        </Col>
      </Row>

      {/* System Health */}
      <Title level={3} style={{ marginTop: "30px" }}>
        System Health
      </Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card className="status-card">
            <Statistic
              title="Server Health"
              value={systemStats.serverHealth}
              suffix="%"
              valueStyle={{
                color: systemStats.serverHealth > 90 ? "#52c41a" : "#faad14",
              }}
              prefix={<SettingOutlined />}
            />
            <Progress
              percent={systemStats.serverHealth}
              status={systemStats.serverHealth > 90 ? "success" : "normal"}
              strokeColor={
                systemStats.serverHealth > 90 ? "#52c41a" : "#faad14"
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card className="status-card">
            <Statistic
              title="Disk Usage"
              value={systemStats.diskUsage}
              suffix="%"
              valueStyle={{
                color: systemStats.diskUsage < 70 ? "#52c41a" : "#faad14",
              }}
              prefix={<FileProtectOutlined />}
            />
            <Progress
              percent={systemStats.diskUsage}
              status={systemStats.diskUsage < 70 ? "success" : "normal"}
              strokeColor={systemStats.diskUsage < 70 ? "#52c41a" : "#faad14"}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card className="status-card">
            <Statistic
              title="Memory Usage"
              value={systemStats.memoryUsage}
              suffix="%"
              valueStyle={{
                color: systemStats.memoryUsage < 70 ? "#52c41a" : "#faad14",
              }}
              prefix={<FileProtectOutlined />}
            />
            <Progress
              percent={systemStats.memoryUsage}
              status={systemStats.memoryUsage < 70 ? "success" : "normal"}
              strokeColor={systemStats.memoryUsage < 70 ? "#52c41a" : "#faad14"}
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Activities */}
      <Title level={3} style={{ marginTop: "30px" }}>
        Recent System Activities
      </Title>
      <Card>
        <Timeline mode="left">
          {recentActivities.map((activity) => (
            <Timeline.Item
              key={activity.id}
              label={moment(activity.timestamp).format("MMM DD, HH:mm")}
              dot={getActivityIcon(activity.action)}
              color={getActivityColor(activity.action)}
            >
              <div style={{ fontWeight: "bold" }}>{activity.action}</div>
              <div>
                <Text type="secondary">By {activity.username}</Text>
              </div>
              <div>{activity.details}</div>
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>
    </div>
  );
};

// Helper functions for activities
const getActivityIcon = (action) => {
  if (action.includes("login")) return <UserOutlined />;
  if (action.includes("backup")) return <FileProtectOutlined />;
  if (action.includes("created")) return <CheckCircleOutlined />;
  if (action.includes("updated")) return <SettingOutlined />;
  if (action.includes("Failed")) return <WarningOutlined />;
  return <ClockCircleOutlined />;
};

const getActivityColor = (action) => {
  if (action.includes("Failed")) return "red";
  if (action.includes("created")) return "green";
  if (action.includes("updated")) return "blue";
  if (action.includes("backup")) return "purple";
  return "gray";
};

export default DashboardOverview;
