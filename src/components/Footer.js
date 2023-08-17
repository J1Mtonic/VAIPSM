import React, { useState } from 'react';
import { Layout, Typography, Space, Button } from 'antd';
import { GithubOutlined, TwitterOutlined, BookOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import { userGuide } from './Guide';

const { Footer: AntFooter } = Layout;
const { Text, Link } = Typography;

function Footer() {
    const [isModalVisible, setIsModalVisible] = useState(false);

    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleClose = () => {
        setIsModalVisible(false);
    };

    return (
        <AntFooter className="footer-container">
            <div className="footer-center footer-buttons">
                <Space size="middle">
                    <Button icon={<GithubOutlined />} href="https://github.com/J1Mtonic/VAIPSM" target="_blank" />
                    <Button icon={<TwitterOutlined />} href="https://twitter.com/Venus_Community" target="_blank" />
                    <Button icon={<BookOutlined />} href="https://docs-v4.venus.io/whats-new/psm" target="_blank" />
                    <Button icon={<InfoCircleOutlined />} onClick={showModal} />
                </Space>
            </div>
            <div className="footer-center">
                <Space direction="vertical" size="middle">
                    <Text className="footer-primary">
                        Made with <Text className="footer-love">❤️</Text> by <Link href="https://venusstars.io" className="gradient-text" target="_blank">VenusStars</Link>
                    </Text>
                </Space>
            </div>
            <Modal
                title="VAI PEG Stability Module UI Guide"
                open={isModalVisible}
                onCancel={handleClose}
                footer={null}
                closable={true}
                maskClosable={true}
            >
                <pre style={{ maxHeight: '400px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>{userGuide}</pre>
            </Modal>
        </AntFooter>
    );
}

export default Footer;