import { Request, Response, NextFunction } from 'express';
import { query } from '@/config/database';
import { logger } from '@/config/logger';
import { ApiResponse } from '@/types/api';

// Check if the request is from mobile app based on headers
const isMobileRequest = (req: Request): boolean => {
  // Check for mobile-specific headers
  const appVersion = req.headers['x-app-version'];
  const platform = req.headers['x-platform'];
  
  // Check if platform header indicates mobile app
  return !!(appVersion && platform && platform.toString().toUpperCase() === 'MOBILE');
};

// Check if user is a field agent
const isFieldAgent = (userRole: string): boolean => {
  return userRole === 'FIELD_AGENT';
};

// Check if user is a non-field agent (backend, admin, super admin, etc.)
const isNonFieldAgent = (userRole: string): boolean => {
  return userRole !== 'FIELD_AGENT';
};

export const platformAccessControl = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username } = req.body;

    if (!username) {
      const response: ApiResponse = {
        success: false,
        message: 'Username is required',
        error: {
          code: 'MISSING_USERNAME',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Get user role from database
    const userRes = await query(
      `SELECT u.role, r.name as "roleName"
       FROM users u
       LEFT JOIN roles r ON u."roleId" = r.id
       WHERE u.username = $1`,
      [username]
    );

    if (userRes.rows.length === 0) {
      // Let the authentication process handle unknown users
      next();
      return;
    }

    const user = userRes.rows[0];
    const userRole = user.role || user.roleName;
    const mobileRequest = isMobileRequest(req);

    // Field Agents can ONLY access mobile app
    if (isFieldAgent(userRole)) {
      if (!mobileRequest) {
        const response: ApiResponse = {
          success: false,
          message: 'Field Agents can only access the mobile application. Please use the mobile app to log in.',
          error: {
            code: 'FIELD_AGENT_MOBILE_ONLY',
          },
        };
        res.status(403).json(response);
        return;
      }
    }
    // Non-Field Agents (Backend Users, Admins, Super Admins) can ONLY access web app
    else if (isNonFieldAgent(userRole)) {
      if (mobileRequest) {
        const response: ApiResponse = {
          success: false,
          message: 'Administrative users can only access the web application. Please use the web app to log in.',
          error: {
            code: 'NON_FIELD_AGENT_WEB_ONLY',
          },
        };
        res.status(403).json(response);
        return;
      }
    }

    // If all checks pass, continue to authentication
    next();
  } catch (error) {
    logger.error('Platform access control error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Access control validation failed',
      error: {
        code: 'ACCESS_CONTROL_ERROR',
      },
    };
    res.status(500).json(response);
  }
};