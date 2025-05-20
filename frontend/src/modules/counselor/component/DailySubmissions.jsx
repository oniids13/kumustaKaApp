import React, { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Spin, Alert } from "antd";
import { SmileOutlined, FormOutlined } from "@ant-design/icons";
import axios from "axios";

const DailySubmissions = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submissionData, setSubmissionData] = useState(null);

  useEffect(() => {
    const fetchDailySubmissions = async () => {
      try {
        setLoading(true);
        const userData = localStorage.getItem("userData");

        console.log("Debug Info:", {
          userData: userData ? JSON.parse(userData) : null,
        });

        if (!userData) {
          throw new Error("No user data found. Please log in again.");
        }

        const parsedUserData = JSON.parse(userData);
        if (!parsedUserData.token) {
          throw new Error(
            "No authentication token found. Please log in again."
          );
        }

        if (parsedUserData.role !== "COUNSELOR") {
          throw new Error("Access denied. Counselor role required.");
        }

        const headers = {
          Authorization: `Bearer ${parsedUserData.token}`,
        };

        console.log(
          "Making request to:",
          "http://localhost:3000/api/counselor/daily-submissions"
        );
        console.log("With headers:", headers);

        const response = await axios.get(
          "http://localhost:3000/api/counselor/daily-submissions",
          {
            headers,
            validateStatus: function (status) {
              return status < 500; // Resolve only if the status code is less than 500
            },
          }
        );

        console.log("Response status:", response.status);
        console.log("Response data:", response.data);

        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }

        if (response.status === 403) {
          throw new Error("Access denied. Counselor role required.");
        }

        setSubmissionData(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching daily submissions:", err);
        console.error("Error details:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          headers: err.response?.headers,
        });

        if (err.response?.status === 401) {
          setError("Your session has expired. Please log in again.");
        } else if (err.response?.status === 403) {
          setError("Access denied. Counselor role required.");
        } else {
          setError(
            err.response?.data?.error ||
              err.message ||
              "Failed to fetch daily submission data"
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDailySubmissions();
    // Refresh data every minute
    const interval = setInterval(fetchDailySubmissions, 60000);
    return () => clearInterval(interval);
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
              value={submissionData?.moodEntriesCount || 0}
              prefix={<SmileOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="Survey Responses"
              value={submissionData?.surveyResponsesCount || 0}
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
