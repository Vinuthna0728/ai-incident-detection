def auto_resolve(root_cause):
    if "CPU" in root_cause:
        return "Scaled system resources"
    elif "database" in root_cause.lower():
        return "Restarted DB service"
    return "Manual intervention required"