import React from "react";
import {
  Modal,
  Descriptions,
  Avatar,
  Tag,
  Badge,
  Card,
  List,
  Typography,
  Divider,
  Space,
  Row,
  Col,
  Statistic,
  Empty,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  AlertOutlined,
  ManOutlined,
  WomanOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import moment from "moment";

const { Title, Text } = Typography;

const UserProfileView = ({ visible, onClose, userProfile, loading }) => {
  if (!userProfile) {
    return (
      <Modal
        title="User Profile"
        open={visible}
        onCancel={onClose}
        footer={null}
        width={800}
        loading={loading}
      >
        <Empty description="No user data available" />
      </Modal>
    );
  }

  const getStatusColor = (status) => {
    return status === "ACTIVE" ? "success" : "default";
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "ADMIN":
        return "purple";
      case "COUNSELOR":
        return "orange";
      case "TEACHER":
        return "green";
      case "STUDENT":
        return "blue";
      default:
        return "default";
    }
  };

  const getGenderDisplay = (gender) => {
    switch (gender) {
      case "MALE":
        return { label: "Male", icon: <ManOutlined />, color: "blue" };
      case "FEMALE":
        return { label: "Female", icon: <WomanOutlined />, color: "magenta" };
      case "OTHER":
        return { label: "Other", icon: <UserOutlined />, color: "purple" };
      case "PREFER_NOT_TO_SAY":
        return {
          label: "Prefer not to say",
          icon: <UserOutlined />,
          color: "default",
        };
      default:
        return null;
    }
  };

  const getZoneColor = (zone) => {
    switch (zone?.toLowerCase()) {
      case "green":
        return "success";
      case "yellow":
        return "warning";
      case "red":
        return "error";
      default:
        return "default";
    }
  };

  const renderBasicInfo = () => (
    <Card title="Basic Information" style={{ marginBottom: 16 }}>
      <Row gutter={16}>
        <Col span={4}>
          <Avatar
            size={80}
            src={userProfile.avatar}
            icon={<UserOutlined />}
            style={{
              backgroundColor: userProfile.avatar ? "transparent" : "#722ed1",
            }}
          />
        </Col>
        <Col span={20}>
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Full Name">
              <Text strong>
                {userProfile.firstName} {userProfile.lastName}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              <Space>
                <MailOutlined />
                {userProfile.email}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Phone">
              <Space>
                <PhoneOutlined />
                {userProfile.phone || "Not provided"}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Role">
              <Tag color={getRoleColor(userProfile.role)}>
                {userProfile.role}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Gender">
              {userProfile.gender ? (
                <Space>
                  {getGenderDisplay(userProfile.gender)?.icon}
                  <Tag color={getGenderDisplay(userProfile.gender)?.color}>
                    {getGenderDisplay(userProfile.gender)?.label}
                  </Tag>
                </Space>
              ) : (
                <Text type="secondary">Not specified</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Badge
                status={getStatusColor(userProfile.status)}
                text={userProfile.status}
              />
            </Descriptions.Item>
            <Descriptions.Item label="Member Since">
              <Space>
                <CalendarOutlined />
                {moment(userProfile.createdAt).format("MMM DD, YYYY")}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Last Login">
              {userProfile.lastLogin
                ? moment(userProfile.lastLogin).format("MMM DD, YYYY HH:mm")
                : "Never logged in"}
            </Descriptions.Item>
            <Descriptions.Item label="Last Updated">
              {moment(userProfile.updatedAt).format("MMM DD, YYYY HH:mm")}
            </Descriptions.Item>
            {userProfile.role === "STUDENT" && (
              <Descriptions.Item label="Section" span={2}>
                {userProfile.student?.section ? (
                  <Space>
                    <TeamOutlined />
                    <Tag color="purple">{userProfile.student.section.name}</Tag>
                    {userProfile.student.section.gradeLevel && (
                      <Text type="secondary">
                        ({userProfile.student.section.gradeLevel})
                      </Text>
                    )}
                  </Space>
                ) : (
                  <Text type="secondary">No section assigned</Text>
                )}
              </Descriptions.Item>
            )}
            {userProfile.role === "TEACHER" && (
              <Descriptions.Item label="Assigned Section" span={2}>
                {userProfile.teacher?.section ? (
                  <Space>
                    <TeamOutlined />
                    <Tag color="green">{userProfile.teacher.section.name}</Tag>
                    {userProfile.teacher.section.gradeLevel && (
                      <Text type="secondary">
                        ({userProfile.teacher.section.gradeLevel})
                      </Text>
                    )}
                  </Space>
                ) : (
                  <Text type="secondary">No section assigned</Text>
                )}
              </Descriptions.Item>
            )}
            {userProfile.role === "COUNSELOR" &&
              userProfile.counselor?.sections?.length > 0 && (
                <Descriptions.Item label="Assigned Sections" span={2}>
                  <Space wrap>
                    <TeamOutlined />
                    {userProfile.counselor.sections.map((section) => (
                      <Tag key={section.id} color="orange">
                        {section.name}
                        {section.gradeLevel && ` (${section.gradeLevel})`}
                      </Tag>
                    ))}
                  </Space>
                </Descriptions.Item>
              )}
          </Descriptions>
        </Col>
      </Row>
    </Card>
  );

  const renderEmergencyContacts = () => {
    if (!userProfile.student?.emergencyContacts?.length) {
      return (
        <Card title="Emergency Contacts" style={{ marginBottom: 16 }}>
          <Empty description="No emergency contacts added" />
        </Card>
      );
    }

    return (
      <Card title="Emergency Contacts" style={{ marginBottom: 16 }}>
        <List
          dataSource={userProfile.student.emergencyContacts}
          renderItem={(contact) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={<UserOutlined />}
                    style={{
                      backgroundColor: contact.isPrimary
                        ? "#52c41a"
                        : "#1890ff",
                    }}
                  />
                }
                title={
                  <Space>
                    <Text strong>{contact.name}</Text>
                    {contact.isPrimary && (
                      <Tag color="green" size="small">
                        Primary
                      </Tag>
                    )}
                  </Space>
                }
                description={
                  <Space direction="vertical" size={0}>
                    <Text type="secondary">
                      Relationship: {contact.relationship}
                    </Text>
                    <Space>
                      <PhoneOutlined />
                      <Text>{contact.phone}</Text>
                    </Space>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    );
  };

  const renderCounselorInfo = () => {
    if (!userProfile.counselor) return null;

    const { counselor } = userProfile;
    const activeInterventions =
      counselor.interventions?.filter(
        (intervention) => intervention.status === "IN_PROGRESS"
      ).length || 0;

    return (
      <Card title="Counselor Information" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="Total Interventions"
              value={counselor.interventions?.length || 0}
              prefix={<AlertOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Active Interventions"
              value={activeInterventions}
              prefix={<AlertOutlined />}
            />
          </Col>
        </Row>

        {counselor.interventions?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Divider orientation="left" orientationMargin="0">
              Recent Interventions
            </Divider>
            <List
              size="small"
              dataSource={counselor.interventions.slice(0, 3)}
              renderItem={(intervention) => (
                <List.Item>
                  <List.Item.Meta
                    title={intervention.title}
                    description={
                      <Space>
                        <Tag
                          color={
                            intervention.status === "COMPLETED"
                              ? "green"
                              : intervention.status === "IN_PROGRESS"
                              ? "blue"
                              : "default"
                          }
                        >
                          {intervention.status}
                        </Tag>
                        <Text type="secondary">
                          {moment(intervention.createdAt).format(
                            "MMM DD, YYYY"
                          )}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        )}
      </Card>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <UserOutlined />
          User Profile: {userProfile.firstName} {userProfile.lastName}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
      style={{ top: 20 }}
      bodyStyle={{ maxHeight: "70vh", overflowY: "auto" }}
    >
      {renderBasicInfo()}

      {userProfile.role === "STUDENT" && <>{renderEmergencyContacts()}</>}

      {userProfile.role === "COUNSELOR" && renderCounselorInfo()}
    </Modal>
  );
};

export default UserProfileView;
