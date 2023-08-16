import React from 'react';
import { Layout, Typography, Space, Button } from 'antd';
import { GithubOutlined, TwitterOutlined } from '@ant-design/icons';

const { Footer: AntFooter } = Layout;
const { Text, Link } = Typography;

function Footer() {
    return (
        <AntFooter className="footer-container">
            <div className="footer-center footer-buttons">
                <Space size="middle">
                    <Button icon={<GithubOutlined />} href="https://github.com/J1Mtonic/VAIPSM" target="_blank" />
                    <Button icon={<TwitterOutlined />} href="https://twitter.com/Venus_Community" target="_blank" />
                </Space>
            </div>
            <div className="footer-center">
                <Space direction="vertical" size="middle">
                    <Text className="footer-primary">
                        Made with <Text className="footer-love">❤️</Text> by <Link href="https://venusstars.io" className="gradient-text" target="_blank">VenusStars</Link>
                    </Text>
                </Space>
            </div>
        </AntFooter>
    );
}

export default Footer;