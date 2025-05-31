import React, { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Spin, Alert } from "antd";
import { SmileOutlined, FormOutlined } from "@ant-design/icons";
import axios from "axios";

const DailySubmissions = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submissions, setSubmissions] = useState(null);

  useEffect(() => {
    const fetchDailySubmissions = async () => {
      try {
        setLoading(true);
        
        const userData = JSON.parse(localStorage.getItem("userData"));
        const token = userData?.token;

        if (!token) {
          throw new Error("No authentication token found");
        }

        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        const response = await axios.get(
          "http://localhost:3000/api/counselor/daily-submissions",
          { headers }
        );

        if (response.data) {
          setSubmissions(response.data);
        }
      } catch (err) {
        console.error("Error fetching daily submissions:", err);
        setError(err.message || "Failed to fetch daily submission data");
      } finally {
        setLoading(false);
      }
    };

    fetchDailySubmissions();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        style={{ marginBottom: "20px" }}
      />
    );
  }

  return (
    <Card title="Today's Submissions" style={{ marginBottom: "20px" }}>
      <Row gutter={16}>
        <Col span={12}>
          <Card>
            <Statistic
              title="Mood Entries"
              value={submissions?.moodEntriesCount || 0}
              prefix={<SmileOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="Survey Responses"
              value={submissions?.surveyResponsesCount || 0}
              prefix={<FormOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
      </Row>
    </Card>
  );
};

export default DailySubmissions;
