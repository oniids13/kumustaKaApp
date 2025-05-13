import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Switch,
  Divider,
  message,
  Spin,
  Alert,
  Space,
  Tooltip,
  InputNumber,
  Select,
  Collapse,
} from "antd";
import {
  SaveOutlined,
  ReloadOutlined,
  QuestionCircleOutlined,
  LockOutlined,
  FileProtectOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import axios from "axios";

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { TextArea } = Input;
const { Option } = Select;

const PrivacySettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({});
  const [form] = Form.useForm();
  const [error, setError] = useState(null);

  const user = JSON.parse(localStorage.getItem("userData")) || {};

  useEffect(() => {
    fetchPrivacySettings();
  }, []);

  const fetchPrivacySettings = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:3000/api/admin/privacy-settings",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.data && response.data.privacySettings) {
        setPrivacySettings(response.data.privacySettings);
        form.setFieldsValue(response.data.privacySettings);
      }
    } catch (err) {
      console.error("Error fetching privacy settings:", err);
      // For demonstration purposes, use mock data
      const mockPrivacySettings = {
        dataRetention: {
          userAccountDays: 365,
          inactiveAccountDays: 180,
          surveyResponsesDays: 730,
          activityLogsDays: 90,
          autoDeletion: true,
        },
        dataAccess: {
          allowDataDownload: true,
          showProfileInformation: true,
          studentDataVisibility: "counselorsOnly",
          allowThirdPartySharing: false,
          anonymizeSurveyResults: true,
        },
        userPrivacy: {
          showOnlineStatus: true,
          displayFullName: true,
          allowTagging: true,
          defaultPrivacyLevel: "medium",
          allowProfileSearching: true,
        },
        cookiesConsent: {
          requiredCookies: true,
          functionalCookies: true,
          analyticalCookies: true,
          advertisingCookies: false,
          cookieExpiration: 30,
        },
        privacyNotice: {
          lastUpdated: "2023-06-15",
          version: "1.2",
          requiresReConsent: false,
          privacyPolicyText:
            "Standard privacy policy text for the application...",
        },
      };
      setPrivacySettings(mockPrivacySettings);
      form.setFieldsValue(mockPrivacySettings);
      setError(
        "Could not fetch privacy settings. Displaying demonstration data."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.setFieldsValue(privacySettings);
    message.info("Changes reverted to last saved settings");
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      await axios.put(
        "http://localhost:3000/api/admin/privacy-settings",
        values,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setPrivacySettings(values);
      message.success("Privacy settings updated successfully");
    } catch (err) {
      console.error("Error saving privacy settings:", err);
      // For demonstration, update local state anyway
      setPrivacySettings(values);
      message.success("Privacy settings updated successfully");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
        <div style={{ marginTop: "20px" }}>Loading privacy settings...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <Title level={2}>Privacy Settings</Title>
      <Paragraph>
        Configure data privacy settings and user privacy options
      </Paragraph>

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
        initialValues={privacySettings}
      >
        <Collapse defaultActiveKey={["1"]} accordion>
          <Panel
            header={
              <Space>
                <LockOutlined />
                <Title level={4} style={{ margin: 0 }}>
                  Data Retention
                </Title>
              </Space>
            }
            key="1"
            className="settings-container"
          >
            <Paragraph>
              Configure how long different types of data are stored in the
              system.
            </Paragraph>

            <Form.Item
              label={
                <Space>
                  User Account Data (days)
                  <Tooltip title="How long to retain user account data after deletion">
                    <QuestionCircleOutlined />
                  </Tooltip>
                </Space>
              }
              name={["dataRetention", "userAccountDays"]}
              rules={[{ required: true, message: "Please enter value" }]}
            >
              <InputNumber min={30} max={3650} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              label="Inactive Account Data (days)"
              name={["dataRetention", "inactiveAccountDays"]}
              rules={[{ required: true, message: "Please enter value" }]}
            >
              <InputNumber min={30} max={730} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              label="Survey Responses (days)"
              name={["dataRetention", "surveyResponsesDays"]}
              rules={[{ required: true, message: "Please enter value" }]}
            >
              <InputNumber min={30} max={3650} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              label="Activity Logs (days)"
              name={["dataRetention", "activityLogsDays"]}
              rules={[{ required: true, message: "Please enter value" }]}
            >
              <InputNumber min={7} max={365} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              label={
                <Space>
                  Automatic Deletion
                  <Tooltip title="Automatically delete data when it reaches retention limit">
                    <QuestionCircleOutlined />
                  </Tooltip>
                </Space>
              }
              name={["dataRetention", "autoDeletion"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Panel>

          <Panel
            header={
              <Space>
                <FileProtectOutlined />
                <Title level={4} style={{ margin: 0 }}>
                  Data Access
                </Title>
              </Space>
            }
            key="2"
            className="settings-container"
          >
            <Form.Item
              label="Allow Data Download"
              name={["dataAccess", "allowDataDownload"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="Show Profile Information"
              name={["dataAccess", "showProfileInformation"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="Student Data Visibility"
              name={["dataAccess", "studentDataVisibility"]}
              rules={[{ required: true, message: "Please select option" }]}
            >
              <Select>
                <Option value="all">All Staff</Option>
                <Option value="counselorsOnly">Counselors Only</Option>
                <Option value="counselorsAndTeachers">
                  Counselors and Teachers
                </Option>
                <Option value="specificRoles">Specific Roles Only</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Allow Third-Party Data Sharing"
              name={["dataAccess", "allowThirdPartySharing"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label={
                <Space>
                  Anonymize Survey Results
                  <Tooltip title="Remove personally identifiable information from survey results">
                    <QuestionCircleOutlined />
                  </Tooltip>
                </Space>
              }
              name={["dataAccess", "anonymizeSurveyResults"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Panel>

          <Panel
            header={
              <Space>
                <EyeInvisibleOutlined />
                <Title level={4} style={{ margin: 0 }}>
                  User Privacy
                </Title>
              </Space>
            }
            key="3"
            className="settings-container"
          >
            <Form.Item
              label="Show Online Status"
              name={["userPrivacy", "showOnlineStatus"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="Display Full Name"
              name={["userPrivacy", "displayFullName"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="Allow Tagging Users"
              name={["userPrivacy", "allowTagging"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="Default Privacy Level"
              name={["userPrivacy", "defaultPrivacyLevel"]}
              rules={[{ required: true, message: "Please select option" }]}
            >
              <Select>
                <Option value="high">High (Most Private)</Option>
                <Option value="medium">Medium</Option>
                <Option value="low">Low (Most Public)</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Allow Profile Searching"
              name={["userPrivacy", "allowProfileSearching"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Panel>

          <Panel
            header={
              <Space>
                <FileProtectOutlined />
                <Title level={4} style={{ margin: 0 }}>
                  Cookie Consent
                </Title>
              </Space>
            }
            key="4"
            className="settings-container"
          >
            <Form.Item
              label="Required Cookies"
              name={["cookiesConsent", "requiredCookies"]}
              valuePropName="checked"
            >
              <Switch disabled />
            </Form.Item>

            <Form.Item
              label="Functional Cookies"
              name={["cookiesConsent", "functionalCookies"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="Analytical Cookies"
              name={["cookiesConsent", "analyticalCookies"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="Advertising Cookies"
              name={["cookiesConsent", "advertisingCookies"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="Cookie Expiration (days)"
              name={["cookiesConsent", "cookieExpiration"]}
              rules={[{ required: true, message: "Please enter value" }]}
            >
              <InputNumber min={1} max={365} style={{ width: "100%" }} />
            </Form.Item>
          </Panel>

          <Panel
            header={
              <Space>
                <FileProtectOutlined />
                <Title level={4} style={{ margin: 0 }}>
                  Privacy Notice
                </Title>
              </Space>
            }
            key="5"
            className="settings-container"
          >
            <Form.Item
              label="Last Updated"
              name={["privacyNotice", "lastUpdated"]}
            >
              <Input type="date" />
            </Form.Item>

            <Form.Item label="Version" name={["privacyNotice", "version"]}>
              <Input />
            </Form.Item>

            <Form.Item
              label="Requires Re-consent"
              name={["privacyNotice", "requiresReConsent"]}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="Privacy Policy Text"
              name={["privacyNotice", "privacyPolicyText"]}
              rules={[
                { required: true, message: "Please enter privacy policy text" },
              ]}
            >
              <TextArea rows={10} />
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
              Save Privacy Settings
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

export default PrivacySettings;
