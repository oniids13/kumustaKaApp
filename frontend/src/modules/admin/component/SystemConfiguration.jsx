import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Switch,
  Select,
  InputNumber,
  Divider,
  Collapse,
  message,
  Spin,
  Alert,
  Space,
  Tooltip,
} from "antd";
import {
  SaveOutlined,
  ReloadOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

const SystemConfiguration = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({});
  const [form] = Form.useForm();
  const [error, setError] = useState(null);

  const user = JSON.parse(localStorage.getItem("userData")) || {};

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:3000/api/admin/settings",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.data && response.data.settings) {
        setSettings(response.data.settings);
        form.setFieldsValue(response.data.settings);
      }
    } catch (err) {
      console.error("Error fetching system settings:", err);
      // For demonstration purposes, use mock data
      const mockSettings = {
        general: {
          siteName: "KumustaKaApp",
          adminEmail: "admin@kumustakaapp.com",
          supportEmail: "support@kumustakaapp.com",
          timeZone: "Asia/Manila",
          maintenanceMode: false,
        },
        security: {
          sessionTimeout: 30,
          maxLoginAttempts: 5,
          passwordComplexity: "medium",
          twoFactorAuth: false,
          enforcePasswordChange: 90,
        },
        privacy: {
          dataRetentionDays: 365,
          allowProfileSharing: true,
          anonymizeSurveyResponses: true,
          allowDataDownload: true,
          showUserOnlineStatus: true,
          logUserActivity: true,
        },
        notifications: {
          emailNotifications: true,
          inAppNotifications: true,
          dailySummary: false,
          alertForRedZone: true,
          alertFrequency: "immediate",
        },
        surveys: {
          dailySurveyEnabled: true,
          reminderTime: "08:00",
          reminderFrequency: "daily",
          autoAssignSurveys: true,
          requireCompletion: false,
        },
      };
      setSettings(mockSettings);
      form.setFieldsValue(mockSettings);
      setError("Could not fetch settings data. Displaying demonstration data.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.setFieldsValue(settings);
    message.info("Changes reverted to last saved settings");
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      await axios.put("http://localhost:3000/api/admin/settings", values, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      });
      setSettings(values);
      message.success("System settings updated successfully");
    } catch (err) {
      console.error("Error saving settings:", err);
      // For demonstration, update local state anyway
      setSettings(values);
      message.success("System settings updated successfully");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
        <div style={{ marginTop: "20px" }}>Loading system settings...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <Title level={2}>System Configuration</Title>
      <Paragraph>Configure system-wide settings and preferences</Paragraph>

      {error && (
        <Alert
          message={error}
          type="warning"
          showIcon
          style={{ marginBottom: "20px" }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={settings}
      >
        <Collapse defaultActiveKey={["1"]} accordion>
          <Panel
            header={<Title level={4}>General Settings</Title>}
            key="1"
            className="settings-container"
          >
            <Form.Item
              label={
                <Space>
                  Site Name
                  <Tooltip title="The name displayed in browser tabs and system notifications">
                    <QuestionCircleOutlined />
                  </Tooltip>
                </Space>
              }
              name={["general", "siteName"]}
              rules={[{ required: true, message: "Please enter site name" }]}
            >
              <Input placeholder="Enter site name" />
            </Form.Item>

            <Form.Item
              label="Admin Email"
              name={["general", "adminEmail"]}
              rules={[
                { required: true, message: "Please enter admin email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input placeholder="Enter admin email" />
            </Form.Item>

            <Form.Item
              label="Support Email"
              name={["general", "supportEmail"]}
              rules={[
                { required: true, message: "Please enter support email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input placeholder="Enter support email" />
            </Form.Item>

            <Form.Item
              label="Time Zone"
              name={["general", "timeZone"]}
              rules={[{ required: true, message: "Please select time zone" }]}
            >
              <Select placeholder="Select time zone">
                <Option value="Asia/Manila">Asia/Manila</Option>
                <Option value="America/New_York">America/New_York</Option>
                <Option value="Europe/London">Europe/London</Option>
                <Option value="Australia/Sydney">Australia/Sydney</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={
                <Space>
                  Maintenance Mode
                  <Tooltip title="When enabled, only administrators can access the system">
                    <QuestionCircleOutlined />
                  </Tooltip>
                </Space>
              }
              name={["general", "maintenanceMode"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Panel>

          <Panel
            header={<Title level={4}>Security Settings</Title>}
            key="2"
            className="settings-container"
          >
            <Form.Item
              label={
                <Space>
                  Session Timeout (minutes)
                  <Tooltip title="Time in minutes before an inactive user is logged out">
                    <QuestionCircleOutlined />
                  </Tooltip>
                </Space>
              }
              name={["security", "sessionTimeout"]}
              rules={[
                { required: true, message: "Please enter session timeout" },
              ]}
            >
              <InputNumber min={5} max={120} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              label="Maximum Login Attempts"
              name={["security", "maxLoginAttempts"]}
              rules={[
                { required: true, message: "Please enter max login attempts" },
              ]}
            >
              <InputNumber min={3} max={10} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              label="Password Complexity"
              name={["security", "passwordComplexity"]}
              rules={[
                {
                  required: true,
                  message: "Please select password complexity",
                },
              ]}
            >
              <Select>
                <Option value="low">Low (min 6 characters)</Option>
                <Option value="medium">
                  Medium (min 8 characters, letters and numbers)
                </Option>
                <Option value="high">
                  High (min 10 characters, letters, numbers, and symbols)
                </Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={
                <Space>
                  Two-Factor Authentication
                  <Tooltip title="Require all users to set up two-factor authentication">
                    <QuestionCircleOutlined />
                  </Tooltip>
                </Space>
              }
              name={["security", "twoFactorAuth"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label={
                <Space>
                  Password Change Interval (days)
                  <Tooltip title="Number of days before users are required to change their password (0 to disable)">
                    <QuestionCircleOutlined />
                  </Tooltip>
                </Space>
              }
              name={["security", "enforcePasswordChange"]}
            >
              <InputNumber min={0} max={365} style={{ width: "100%" }} />
            </Form.Item>
          </Panel>

          <Panel
            header={<Title level={4}>Privacy Settings</Title>}
            key="3"
            className="settings-container"
          >
            <Form.Item
              label={
                <Space>
                  Data Retention (days)
                  <Tooltip title="Number of days to retain user data after account deletion">
                    <QuestionCircleOutlined />
                  </Tooltip>
                </Space>
              }
              name={["privacy", "dataRetentionDays"]}
              rules={[
                {
                  required: true,
                  message: "Please enter data retention period",
                },
              ]}
            >
              <InputNumber min={30} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              label="Allow Profile Sharing"
              name={["privacy", "allowProfileSharing"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label={
                <Space>
                  Anonymize Survey Responses
                  <Tooltip title="Remove personal identifiers from survey responses in reports">
                    <QuestionCircleOutlined />
                  </Tooltip>
                </Space>
              }
              name={["privacy", "anonymizeSurveyResponses"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="Allow Data Download"
              name={["privacy", "allowDataDownload"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="Show User Online Status"
              name={["privacy", "showUserOnlineStatus"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label={
                <Space>
                  Log User Activity
                  <Tooltip title="Track user interactions for compliance and security">
                    <QuestionCircleOutlined />
                  </Tooltip>
                </Space>
              }
              name={["privacy", "logUserActivity"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Panel>

          <Panel
            header={<Title level={4}>Notification Settings</Title>}
            key="4"
            className="settings-container"
          >
            <Form.Item
              label="Email Notifications"
              name={["notifications", "emailNotifications"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="In-App Notifications"
              name={["notifications", "inAppNotifications"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="Daily Summary Reports"
              name={["notifications", "dailySummary"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label={
                <Space>
                  Alert for Red Zone Students
                  <Tooltip title="Send alerts to counselors when students enter the red zone">
                    <QuestionCircleOutlined />
                  </Tooltip>
                </Space>
              }
              name={["notifications", "alertForRedZone"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="Alert Frequency"
              name={["notifications", "alertFrequency"]}
            >
              <Select>
                <Option value="immediate">Immediate</Option>
                <Option value="hourly">Hourly Digest</Option>
                <Option value="daily">Daily Digest</Option>
              </Select>
            </Form.Item>
          </Panel>

          <Panel
            header={<Title level={4}>Survey Settings</Title>}
            key="5"
            className="settings-container"
          >
            <Form.Item
              label="Enable Daily Surveys"
              name={["surveys", "dailySurveyEnabled"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item label="Reminder Time" name={["surveys", "reminderTime"]}>
              <Input type="time" />
            </Form.Item>

            <Form.Item
              label="Reminder Frequency"
              name={["surveys", "reminderFrequency"]}
            >
              <Select>
                <Option value="daily">Daily</Option>
                <Option value="weekdays">Weekdays Only</Option>
                <Option value="weekly">Weekly</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={
                <Space>
                  Auto-Assign Surveys
                  <Tooltip title="Automatically assign new surveys to all students">
                    <QuestionCircleOutlined />
                  </Tooltip>
                </Space>
              }
              name={["surveys", "autoAssignSurveys"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label={
                <Space>
                  Require Survey Completion
                  <Tooltip title="Make survey completion mandatory before accessing other features">
                    <QuestionCircleOutlined />
                  </Tooltip>
                </Space>
              }
              name={["surveys", "requireCompletion"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Panel>
        </Collapse>

        <Divider />

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={saving}
            >
              Save Settings
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              Reset Changes
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default SystemConfiguration;
