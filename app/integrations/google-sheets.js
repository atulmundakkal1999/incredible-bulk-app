import { google } from 'googleapis';

class GoogleSheetsIntegration {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  getAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.readonly'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    });
  }

  async getToken(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      return tokens;
    } catch (error) {
      console.error('Error getting Google token:', error);
      throw error;
    }
  }

  setCredentials(tokens) {
    this.oauth2Client.setCredentials(tokens);
  }

  async getSpreadsheet(spreadsheetId) {
    try {
      const sheets = google.sheets({ version: 'v4', auth: this.oauth2Client });
      const response = await sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId,
      });
      return response.data;
    } catch (error) {
      console.error('Error getting spreadsheet:', error);
      throw error;
    }
  }

  async getSheetData(spreadsheetId, range) {
    try {
      const sheets = google.sheets({ version: 'v4', auth: this.oauth2Client });
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: range,
      });
      return response.data.values || [];
    } catch (error) {
      console.error('Error getting sheet data:', error);
      throw error;
    }
  }

  async updateSheetData(spreadsheetId, range, values) {
    try {
      const sheets = google.sheets({ version: 'v4', auth: this.oauth2Client });
      const response = await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: range,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: values,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating sheet data:', error);
      throw error;
    }
  }

  async executeOperation(operation, parameters) {
    try {
      const { spreadsheetId, range, operation_type } = parameters;
      
      switch (operation_type) {
        case 'sort':
          return await this.sortData(spreadsheetId, range, parameters);
        case 'filter':
          return await this.filterData(spreadsheetId, range, parameters);
        case 'formula':
          return await this.applyFormula(spreadsheetId, range, parameters);
        default:
          throw new Error(`Unsupported operation: ${operation_type}`);
      }
    } catch (error) {
      console.error('Error executing operation:', error);
      throw error;
    }
  }

  async sortData(spreadsheetId, range, parameters) {
    const { column, ascending = true } = parameters;
    const data = await this.getSheetData(spreadsheetId, range);
    
    if (data.length === 0) return { success: true, message: 'No data to sort' };
    
    const headers = data[0];
    const dataRows = data.slice(1);
    const columnIndex = headers.indexOf(column);
    
    if (columnIndex === -1) {
      throw new Error(`Column "${column}" not found`);
    }
    
    dataRows.sort((a, b) => {
      const aVal = a[columnIndex] || '';
      const bVal = b[columnIndex] || '';
      
      if (ascending) {
        return aVal.localeCompare(bVal);
      } else {
        return bVal.localeCompare(aVal);
      }
    });
    
    const sortedData = [headers, ...dataRows];
    await this.updateSheetData(spreadsheetId, range, sortedData);
    
    return {
      success: true,
      message: `Data sorted by ${column} ${ascending ? 'ascending' : 'descending'}`,
      data: sortedData
    };
  }

  async filterData(spreadsheetId, range, parameters) {
    const { column, condition, value } = parameters;
    const data = await this.getSheetData(spreadsheetId, range);
    
    if (data.length === 0) return { success: true, message: 'No data to filter' };
    
    const headers = data[0];
    const dataRows = data.slice(1);
    const columnIndex = headers.indexOf(column);
    
    if (columnIndex === -1) {
      throw new Error(`Column "${column}" not found`);
    }
    
    const filteredRows = dataRows.filter(row => {
      const cellValue = row[columnIndex] || '';
      
      switch (condition) {
        case 'equals':
          return cellValue === value;
        case 'contains':
          return cellValue.includes(value);
        case 'greater_than':
          return parseFloat(cellValue) > parseFloat(value);
        case 'less_than':
          return parseFloat(cellValue) < parseFloat(value);
        default:
          return true;
      }
    });
    
    const filteredData = [headers, ...filteredRows];
    
    return {
      success: true,
      message: `Filtered data by ${column} ${condition} ${value}`,
      data: filteredData,
      originalCount: dataRows.length,
      filteredCount: filteredRows.length
    };
  }

  async applyFormula(spreadsheetId, range, parameters) {
    const { formula, targetRange } = parameters;
    
    // For now, we'll just update the target range with the formula
    // In a real implementation, you'd need to parse and execute the formula
    const formulaData = [[formula]];
    
    await this.updateSheetData(spreadsheetId, targetRange, formulaData);
    
    return {
      success: true,
      message: `Formula applied to ${targetRange}`,
      formula: formula
    };
  }
}

export default GoogleSheetsIntegration;
