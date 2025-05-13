import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Spin,
  Alert,
  Tabs,
  Statistic,
  Row,
  Col,
  Progress,
  Table,
  Tag,
} from "antd";
import {
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  SecurityScanOutlined,
} from "@ant-design/icons";
import axios from "axios";
import moment from "moment";

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

const ComplianceMonitoring = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [complianceData, setComplianceData] = useState({
    dataSecurity: { score: 88, status: "Compliant" },
    dataPrivacy: { score: 92, status: "Compliant" },
    systemSecurity: { score: 76, status: "Action Required" },
  });
  const [securityLogs, setSecurityLogs] = useState([]);

  const user = JSON.parse(localStorage.getItem("userData")) || {};

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // In a real app, this would fetch from the API
      // Mock data for demonstration
      const mockLogs = [];
      for (let i = 0; i < 10; i++) {
        mockLogs.push({
          id: i + 1,
          timestamp: moment().subtract(i, "days").toISOString(),
          level: i % 3 === 0 ? "critical" : i % 2 === 0 ? "warning" : "info",
          description: `Security event ${i + 1}`,
          user: i % 2 === 0 ? "admin" : `user${i}`,
          ipAddress: `192.168.1.${i}`,
        });
      }
      setSecurityLogs(mockLogs);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load compliance data. Using demo data instead.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
        <div style={{ marginTop: "20px" }}>Loading compliance data...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <Title level={2}>Compliance Monitoring</Title>
      <Paragraph>
        Monitor and ensure compliance with data security and privacy regulations
      </Paragraph>

      {error && (
        <Alert
          message={error}
          type="warning"
          showIcon
          style={{ marginBottom: "20px" }}
        />
      )}

      <Tabs defaultActiveKey="1">
        <TabPane
          tab={
            <span>
              <SecurityScanOutlined /> Compliance Status
            </span>
          }
          key="1"
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Data Privacy"
                  value={complianceData.dataPrivacy.score}
                  suffix="%"
                  valueStyle={{
                    color:
                      complianceData.dataPrivacy.score >= 90
                        ? "#52c41a"
                        : "#faad14",
                  }}
                />
                <Tag
                  color={
                    complianceData.dataPrivacy.score >= 90 ? "green" : "orange"
                  }
                >
                  {complianceData.dataPrivacy.status}
                </Tag>
                <Progress
                  percent={complianceData.dataPrivacy.score}
                  status={
                    complianceData.dataPrivacy.score >= 90
                      ? "success"
                      : "normal"
                  }
                  style={{ marginTop: "10px" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Data Security"
                  value={complianceData.dataSecurity.score}
                  suffix="%"
                  valueStyle={{
                    color:
                      complianceData.dataSecurity.score >= 90
                        ? "#52c41a"
                        : "#faad14",
                  }}
                />
                <Tag
                  color={
                    complianceData.dataSecurity.score >= 90 ? "green" : "orange"
                  }
                >
                  {complianceData.dataSecurity.status}
                </Tag>
                <Progress
                  percent={complianceData.dataSecurity.score}
                  status={
                    complianceData.dataSecurity.score >= 90
                      ? "success"
                      : "normal"
                  }
                  style={{ marginTop: "10px" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="System Security"
                  value={complianceData.systemSecurity.score}
                  suffix="%"
                  valueStyle={{
                    color:
                      complianceData.systemSecurity.score >= 80
                        ? "#faad14"
                        : "#f5222d",
                  }}
                />
                <Tag
                  color={
                    complianceData.systemSecurity.score >= 90
                      ? "green"
                      : complianceData.systemSecurity.score >= 80
                      ? "orange"
                      : "red"
                  }
                >
                  {complianceData.systemSecurity.status}
                </Tag>
                <Progress
                  percent={complianceData.systemSecurity.score}
                  status={
                    complianceData.systemSecurity.score >= 90
                      ? "success"
                      : complianceData.systemSecurity.score >= 80
                      ? "normal"
                      : "exception"
                  }
                  style={{ marginTop: "10px" }}
                />
              </Card>
            </Col>
          </Row>

          <Card title="Compliance Issues" style={{ marginTop: "20px" }}>
            <Paragraph>
              The following issues need attention to improve compliance:
            </Paragraph>
            <ul>
              <li>System backups older than 30 days (Critical)</li>
              <li>
                Some user passwords haven't been updated in 90+ days (Warning)
              </li>
              <li>
                Privacy policy needs to be updated for GDPR compliance (Warning)
              </li>
            </ul>
          </Card>
        </TabPane>

        <TabPane tab="Security Logs" key="2">
          <Card>
            <Table
              dataSource={securityLogs}
              columns={[
                {
                  title: "Timestamp",
                  dataIndex: "timestamp",
                  render: (text) => moment(text).format("YYYY-MM-DD HH:mm"),
                  sorter: (a, b) =>
                    moment(a.timestamp).unix() - moment(b.timestamp).unix(),
                },
                {
                  title: "Level",
                  dataIndex: "level",
                  render: (text) => {
                    const color =
                      text === "critical"
                        ? "red"
                        : text === "warning"
                        ? "orange"
                        : "green";
                    const icon =
                      text === "critical" ? (
                        <CloseCircleOutlined />
                      ) : text === "warning" ? (
                        <WarningOutlined />
                      ) : (
                        <CheckCircleOutlined />
                      );
                    return (
                      <Tag color={color} icon={icon}>
                        {text.toUpperCase()}
                      </Tag>
                    );
                  },
                  filters: [
                    { text: "Critical", value: "critical" },
                    { text: "Warning", value: "warning" },
                    { text: "Info", value: "info" },
                  ],
                  onFilter: (value, record) => record.level === value,
                },
                {
                  title: "Description",
                  dataIndex: "description",
                },
                {
                  title: "User",
                  dataIndex: "user",
                },
                {
                  title: "IP Address",
                  dataIndex: "ipAddress",
                },
              ]}
              rowKey="id"
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default ComplianceMonitoring;
